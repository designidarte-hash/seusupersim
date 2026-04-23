import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIGMAPAY_BASE_URL = 'https://api.sigmapay.com.br/api/public/v1';

const PAYMENT_ITEMS: Record<string, { title: string; value: number }> = {
  seguro_prestamista: { title: 'Seguro Prestamista', value: 5279 },
  taxa_transferencia: { title: 'Taxa de Transferência', value: 2874 },
  iof_federal: { title: 'IOF Federal', value: 2490 },
  taxa_scr_bacen: { title: 'Taxa SCR/Bacen', value: 2990 },
  taxa_liberacao_imediata: { title: 'Taxa de Liberação Imediata', value: 3290 },
  seguro_antifraude: { title: 'Seguro Antifraude', value: 3690 },
};

const onlyDigits = (v: unknown) => (typeof v === 'string' ? v.replace(/\D/g, '') : '');

// Generate a valid random CPF (with correct check digits)
const generateRandomCPF = (): string => {
  const n = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10));
  const calcDigit = (arr: number[]) => {
    let sum = 0;
    for (let i = 0; i < arr.length; i++) sum += arr[i] * (arr.length + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  const d1 = calcDigit(n);
  const d2 = calcDigit([...n, d1]);
  return [...n, d1, d2].join('');
};

const FIRST_NAMES = ['Lucas', 'Mariana', 'Pedro', 'Ana', 'Rafael', 'Juliana', 'Bruno', 'Camila', 'Felipe', 'Larissa', 'Gustavo', 'Patricia', 'Thiago', 'Fernanda', 'Ricardo', 'Beatriz', 'Diego', 'Carolina', 'Marcelo', 'Tatiana'];
const LAST_NAMES = ['Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima', 'Araujo', 'Ferreira', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Barbosa', 'Mendes'];

const generateRandomName = (): string => {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
};

const generateRandomPhone = (): string => {
  const ddd = String(Math.floor(Math.random() * (99 - 11 + 1)) + 11).padStart(2, '0');
  const number = String(Math.floor(Math.random() * 90000000) + 10000000);
  return `${ddd}9${number}`.slice(0, 11);
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SIGMAPAY_API_TOKEN = Deno.env.get('SIGMAPAY_API_TOKEN');
    const SIGMAPAY_OFFER_HASH = Deno.env.get('SIGMAPAY_OFFER_HASH');
    const SIGMAPAY_PRODUCT_HASH = Deno.env.get('SIGMAPAY_PRODUCT_HASH');

    if (!SIGMAPAY_API_TOKEN || !SIGMAPAY_OFFER_HASH || !SIGMAPAY_PRODUCT_HASH) {
      return new Response(JSON.stringify({ error: 'SigmaPay credentials not fully configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { value, customer, tiktok } = body || {};
    console.log('create-pix received customer:', JSON.stringify(customer));

    const contentId = typeof tiktok?.content_id === 'string' ? tiktok.content_id : '';
    const paymentItem = PAYMENT_ITEMS[contentId];
    const finalValue = paymentItem?.value ?? value;

    if (!finalValue || typeof finalValue !== 'number' || finalValue < 50) {
      return new Response(JSON.stringify({ error: 'Value must be at least 50 centavos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build customer using real client data; fall back to RANDOM valid data per transaction
    const realCpf = onlyDigits(customer?.document);
    const cpfDigits = realCpf.length === 11 ? realCpf : generateRandomCPF();

    const realPhone = onlyDigits(customer?.phone);
    const phoneDigits = realPhone.length >= 10 ? realPhone : generateRandomPhone();

    const rawName = (typeof customer?.name === 'string' ? customer.name.trim() : '');
    const hasFullName = rawName && rawName.split(/\s+/).length >= 2;
    const customerName = hasFullName
      ? rawName
      : (rawName ? `${rawName} ${LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)]}` : generateRandomName());

    const emailSlug = customerName.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '.').replace(/^\.+|\.+$/g, '');
    const customerEmail = (typeof customer?.email === 'string' && customer.email.includes('@'))
      ? customer.email.trim().toLowerCase()
      : `${emailSlug || 'cliente'}.${cpfDigits.slice(-4)}@gmail.com`;

    console.log('create-pix using customer:', JSON.stringify({ name: customerName, email: customerEmail, phone: phoneDigits, cpf: cpfDigits, randomized: !realCpf }));

    const itemTitle = paymentItem?.title || (finalValue > 2000 ? 'Seguro Prestamista' : 'Taxa de Transferência');

    // SigmaPay payload format
    const payload = {
      api_token: SIGMAPAY_API_TOKEN,
      offer_hash: SIGMAPAY_OFFER_HASH,
      payment_method: 'pix',
      installments: 1,
      amount: finalValue,
      customer: {
        name: customerName,
        email: customerEmail,
        phone_number: phoneDigits,
        document: cpfDigits,
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
          title: itemTitle,
          price: finalValue,
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
      console.error('SigmaPay error:', JSON.stringify(json));
      return new Response(JSON.stringify({
        error: json?.message || json?.error || `SigmaPay API error [${response.status}]`,
        details: json?.errors || null,
      }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SigmaPay returns hash as the unique identifier
    const transactionHash = String(json.hash || '').toLowerCase();
    const qrCode = json.pix?.pix_qr_code || '';
    const qrCodeBase64 = json.pix?.qr_code_base64 || '';

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
      transaction_id: transactionHash,
      status: 'created',
      value: finalValue,
      hashed_email: tiktok?.hashed_email || null,
      hashed_phone: tiktok?.hashed_phone || null,
      hashed_external_id: tiktok?.hashed_external_id || null,
      content_id: tiktok?.content_id || null,
      user_agent: tiktok?.user_agent || req.headers.get('user-agent') || null,
      ip_address: clientIp || null,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: phoneDigits,
      customer_cpf: cpfDigits,
      customer_randomized: !realCpf,
      payer_name: customerName,
    }, { onConflict: 'transaction_id' });

    // Pushcut notification
    try {
      const valueInReais = (finalValue / 100).toFixed(2).replace('.', ',');
      await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'SigmaPay - PIX Gerado',
          text: `PIX Gerado com sucesso\n💰 Valor: R$ ${valueInReais}`,
        }),
      });
    } catch (pushErr) {
      console.error('Pushcut notification error:', pushErr);
    }

    // Return shape compatible with the existing frontend
    return new Response(JSON.stringify({
      id: transactionHash,
      qr_code: qrCode,
      qr_code_base64: qrCodeBase64,
      value: finalValue,
      status: 'created',
      raw: json,
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
