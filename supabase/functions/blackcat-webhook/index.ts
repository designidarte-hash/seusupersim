import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-event, x-webhook-source',
};

const paidEvents = new Set(['transaction.paid']);
const failedEvents = new Set(['transaction.failed']);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const eventHeader = req.headers.get('x-webhook-event') || '';
    const sourceHeader = req.headers.get('x-webhook-source') || '';

    let body: Record<string, any> = {};
    try {
      const rawText = await req.text();
      console.log('BlackCat webhook raw payload:', rawText);
      console.log('Headers — event:', eventHeader, '| source:', sourceHeader);
      if (rawText && rawText.trim().length > 0) {
        try {
          body = JSON.parse(rawText);
        } catch {
          body = Object.fromEntries(new URLSearchParams(rawText).entries());
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse webhook body:', parseErr);
    }

    console.log('BlackCat webhook parsed body:', JSON.stringify(body));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const event = (body.event || eventHeader || '').toString().toLowerCase();
    const rawStatus = (body.status || '').toString().toLowerCase();

    // ===== WITHDRAWAL EVENTS DESATIVADOS =====
    // Cashout foi removido do produto. Ignoramos qualquer webhook de saque
    // (inclusive os atrasados de saques criados antes da remoção) para não
    // gerar registros novos nem notificações.
    const isWithdrawalEvent = event.startsWith('withdrawal.') || typeof body.withdrawalId === 'string' || typeof body.pixKey === 'string';
    if (isWithdrawalEvent) {
      console.log('Withdrawal webhook ignorado (cashout desativado):', event, body.withdrawalId || body.id);
      return new Response(JSON.stringify({ received: true, ignored: true, reason: 'cashout disabled' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ===== TRANSACTION EVENTS (vendas PIX) =====
    const transactionId = typeof body.transactionId === 'string' ? body.transactionId.toLowerCase() : null;

    if (!transactionId) {
      console.error('No transaction ID in BlackCat webhook payload');
      return new Response(JSON.stringify({ received: true, warning: 'missing transactionId' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine final status to store
    let normalizedStatus = rawStatus;
    if (paidEvents.has(event) || rawStatus === 'paid') normalizedStatus = 'paid';
    else if (failedEvents.has(event) || rawStatus === 'cancelled' || rawStatus === 'refunded') {
      normalizedStatus = rawStatus || 'cancelled';
    } else if (rawStatus === 'pending') {
      normalizedStatus = 'created';
    }

    const valueCents = typeof body.amount === 'number' ? body.amount : Number(body.amount) || null;

    try {
      const { error } = await supabaseAdmin.from('pix_payments').upsert({
        transaction_id: transactionId,
        status: normalizedStatus || 'paid',
        payer_name: body.customer?.name || null,
        end_to_end_id: body.endToEndId || null,
        value: valueCents,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'transaction_id' });

      if (error) console.error('DB upsert error:', error);
      else console.log(`Payment ${transactionId} updated to status: ${normalizedStatus}`);
    } catch (dbErr) {
      console.error('DB upsert exception:', dbErr);
    }

    if (normalizedStatus === 'paid') {
      // Pushcut notification
      try {
        const valueInReais = valueCents ? (valueCents / 100).toFixed(2).replace('.', ',') : '0,00';
        await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'BlackCat - Venda Paga',
            text: `Venda Aprovada 🤑\n💰 Valor: R$ ${valueInReais}`,
          }),
        });
      } catch (pushErr) {
        console.error('Pushcut notification error:', pushErr);
      }

      // TikTok Events API — Server-side CompletePayment with Advanced Matching
      try {
        const TIKTOK_ACCESS_TOKEN = Deno.env.get('TIKTOK_ACCESS_TOKEN');
        if (TIKTOK_ACCESS_TOKEN) {
          const pixelCode = 'D7FT65RC77U0PCJMQSTG';
          const valueInReaisNum = valueCents ? valueCents / 100 : 0;

          // Fetch stored Advanced Matching data for this transaction
          let amData: {
            hashed_email?: string | null;
            hashed_phone?: string | null;
            hashed_external_id?: string | null;
            content_id?: string | null;
            user_agent?: string | null;
            ip_address?: string | null;
          } = {};
          try {
            const { data: pixRow } = await supabaseAdmin
              .from('pix_payments')
              .select('hashed_email, hashed_phone, hashed_external_id, content_id, user_agent, ip_address')
              .eq('transaction_id', transactionId)
              .maybeSingle();
            if (pixRow) amData = pixRow;
          } catch (lookupErr) {
            console.error('Failed to load Advanced Matching data:', lookupErr);
          }

          // Fallback content_id detection by value if not stored
          const isSeguro = valueInReaisNum >= 30;
          const contentId = amData.content_id || (isSeguro ? 'seguro_prestamista' : 'taxa_transferencia');
          const contentName = contentId === 'seguro_prestamista' ? 'Seguro Prestamista' : 'Taxa de Transferência';

          const tiktokPayload = {
            pixel_code: pixelCode,
            event: 'CompletePayment',
            event_id: `${transactionId}_completepayment`,
            event_time: Math.floor(Date.now() / 1000),
            context: {
              user_agent: amData.user_agent || req.headers.get('user-agent') || '',
              ip: amData.ip_address || req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
              user: {
                ...(amData.hashed_email ? { email: amData.hashed_email } : {}),
                ...(amData.hashed_phone ? { phone: amData.hashed_phone } : {}),
                ...(amData.hashed_external_id ? { external_id: amData.hashed_external_id } : {}),
              },
            },
            properties: {
              content_type: 'product',
              content_id: contentId,
              content_name: contentName,
              currency: 'BRL',
              value: valueInReaisNum,
              quantity: 1,
            },
          };

          const tiktokRes = await fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Access-Token': TIKTOK_ACCESS_TOKEN,
            },
            body: JSON.stringify({
              event_source: 'web',
              event_source_id: pixelCode,
              data: [tiktokPayload],
            }),
          });

          const tiktokData = await tiktokRes.json();
          console.log('TikTok Events API response:', JSON.stringify(tiktokData));
        } else {
          console.warn('TIKTOK_ACCESS_TOKEN not configured, skipping server-side event');
        }
      } catch (ttErr) {
        console.error('TikTok Events API error:', ttErr);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('BlackCat webhook error:', error);
    return new Response(JSON.stringify({ received: true, error: (error as Error)?.message || 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
