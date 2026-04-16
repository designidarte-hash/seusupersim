import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-pushinpay-token',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate PushInPay webhook token
    const webhookToken = Deno.env.get('PUSHINPAY_WEBHOOK_TOKEN');
    const receivedToken = req.headers.get('x-pushinpay-token');

    if (webhookToken && receivedToken !== webhookToken) {
      console.error('Invalid webhook token received');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, any> = {};

    try {
      const rawText = await req.text();
      console.log('Webhook raw payload:', rawText);

      if (rawText && rawText.trim().length > 0) {
        if (contentType.includes('application/json')) {
          try {
            body = JSON.parse(rawText);
          } catch {
            // Fallback: try urlencoded
            body = Object.fromEntries(new URLSearchParams(rawText).entries());
          }
        } else {
          // urlencoded or unknown — try urlencoded then JSON
          const params = new URLSearchParams(rawText);
          body = Object.fromEntries(params.entries());
          if (!body.id) {
            try { body = JSON.parse(rawText); } catch { /* keep urlencoded */ }
          }
        }
      }
    } catch (parseErr) {
      console.error('Failed to parse webhook body:', parseErr);
    }
    console.log('Webhook parsed body:', JSON.stringify(body));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Normalize to lowercase to avoid case-mismatch with create-pix
    const transactionId = typeof body.id === 'string' ? body.id.toLowerCase() : body.id;
    const status = body.status;

    if (!transactionId) {
      console.error('No transaction ID in webhook payload');
      // Return 200 to avoid PushinPay disabling the webhook on retries
      return new Response(JSON.stringify({ received: true, warning: 'missing transaction id' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    try {
      const { error } = await supabaseAdmin.from('pix_payments').upsert({
        transaction_id: transactionId,
        status: status || 'paid',
        payer_name: body.payer_name || null,
        end_to_end_id: body.end_to_end_id || null,
        value: body.value ? Number(body.value) : null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'transaction_id' });

      if (error) {
        console.error('DB upsert error:', error);
      } else {
        console.log(`Payment ${transactionId} updated to status: ${status}`);
      }
    } catch (dbErr) {
      console.error('DB upsert exception:', dbErr);
    }

    if (status === 'paid' || status === 'completed') {
      // Pushcut notification
      try {
        const valueInReais = body.value ? (Number(body.value) / 100).toFixed(2).replace('.', ',') : '0,00';
        await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'PushinPay - Venda Paga',
            text: `Venda Aprovada 🤑\n💰 Valor: R$ ${valueInReais}`,
          }),
        });
      } catch (pushErr) {
        console.error('Pushcut notification error:', pushErr);
      }

      // TikTok Events API — Server-side CompletePayment
      try {
        const TIKTOK_ACCESS_TOKEN = Deno.env.get('TIKTOK_ACCESS_TOKEN');
        if (TIKTOK_ACCESS_TOKEN) {
          const pixelCode = 'D7FT65RC77U0PCJMQSTG';
          const valueInReaisNum = body.value ? Number(body.value) / 100 : 0;
          const contentId = valueInReaisNum > 20 ? 'seguro_prestamista' : 'taxa_transferencia';
          const contentName = valueInReaisNum > 20 ? 'Seguro Prestamista' : 'Taxa de Transferência';

          const tiktokPayload = {
            pixel_code: pixelCode,
            event: 'CompletePayment',
            event_id: `${transactionId}_${Date.now()}`,
            event_time: Math.floor(Date.now() / 1000),
            context: {
              user_agent: req.headers.get('user-agent') || '',
              ip: req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '',
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
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
