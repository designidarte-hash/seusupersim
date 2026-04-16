import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const onlyDigits = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BLACKCAT_API_KEY = Deno.env.get('BLACKCAT_API_KEY');
    if (!BLACKCAT_API_KEY) {
      return new Response(JSON.stringify({ error: 'BLACKCAT_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { value, customer, tiktok } = body || {};

    if (!value || typeof value !== 'number' || value < 50) {
      return new Response(JSON.stringify({ error: 'Value must be at least 50 centavos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const postbackUrl = `${supabaseUrl}/functions/v1/blackcat-webhook`;

    // Build customer using real client data (with safe fallbacks for BlackCat required fields)
    const cpfDigits = onlyDigits(customer?.document) || '12345678909';
    const phoneDigits = onlyDigits(customer?.phone) || '11999999999';
    const rawName = (typeof customer?.name === 'string' ? customer.name.trim() : '');
    // BlackCat requires full name (first + last). If only one word, append a placeholder surname.
    const customerName = rawName
      ? (rawName.split(/\s+/).length >= 2 ? rawName : `${rawName} Silva`)
      : 'Cliente SuperSim';
    const customerEmail = (typeof customer?.email === 'string' && customer.email.includes('@'))
      ? customer.email.trim().toLowerCase()
      : `cliente+${cpfDigits}@supersim.com.br`;

    const itemTitle = value > 2000 ? 'Seguro Prestamista' : 'Taxa de Transferência';

    const payload = {
      amount: value,
      currency: 'BRL',
      paymentMethod: 'pix',
      items: [
        {
          title: itemTitle,
          unitPrice: value,
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name: customerName,
        email: customerEmail,
        phone: phoneDigits,
        document: {
          number: cpfDigits,
          type: 'cpf',
        },
      },
      pix: {
        expiresInDays: 1,
      },
      postbackUrl,
      externalRef: `supersim-${Date.now()}`,
    };

    const response = await fetch('https://api.blackcatpay.com.br/api/sales/create-sale', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': BLACKCAT_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const json = await response.json();

    if (!response.ok || !json?.success) {
      console.error('BlackCat error:', JSON.stringify(json));
      return new Response(JSON.stringify({
        error: json?.message || json?.error || `BlackCat API error [${response.status}]`,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const data = json.data || {};
    const transactionId = String(data.transactionId || '').toLowerCase();
    const qrCode = data.paymentData?.copyPaste || data.paymentData?.qrCode || '';
    const qrCodeBase64 = data.paymentData?.qrCodeBase64 || '';

    // Persist initial record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Capture client IP for TikTok Advanced Matching
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || req.headers.get('cf-connecting-ip')
      || '';

    await supabaseAdmin.from('pix_payments').upsert({
      transaction_id: transactionId,
      status: 'created',
      value: value,
      hashed_email: tiktok?.hashed_email || null,
      hashed_phone: tiktok?.hashed_phone || null,
      hashed_external_id: tiktok?.hashed_external_id || null,
      content_id: tiktok?.content_id || null,
      user_agent: tiktok?.user_agent || req.headers.get('user-agent') || null,
      ip_address: clientIp || null,
    }, { onConflict: 'transaction_id' });

    // Pushcut notification
    try {
      const valueInReais = (value / 100).toFixed(2).replace('.', ',');
      await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'BlackCat - PIX Gerado',
          text: `PIX Gerado com sucesso\n💰 Valor: R$ ${valueInReais}`,
        }),
      });
    } catch (pushErr) {
      console.error('Pushcut notification error:', pushErr);
    }

    // Return shape compatible with the existing frontend
    return new Response(JSON.stringify({
      id: transactionId,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      value: value,
      status: 'created',
      raw: data,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating PIX:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
