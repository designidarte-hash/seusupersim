import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PUSHINPAY_API_TOKEN = Deno.env.get('PUSHINPAY_API_TOKEN');
    if (!PUSHINPAY_API_TOKEN) {
      return new Response(JSON.stringify({ error: 'PUSHINPAY_API_TOKEN not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { value } = await req.json();

    if (!value || typeof value !== 'number' || value < 50) {
      return new Response(JSON.stringify({ error: 'Value must be at least 50 centavos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build webhook URL pointing to our pix-webhook edge function
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const webhookUrl = `${supabaseUrl}/functions/v1/pix-webhook`;

    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUSHINPAY_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value, webhook_url: webhookUrl }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PushInPay error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.message || `PushInPay API error [${response.status}]` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store the initial payment record
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    await supabaseAdmin.from('pix_payments').upsert({
      transaction_id: data.id,
      status: 'created',
      value: value,
    }, { onConflict: 'transaction_id' });

    // Send Pushcut notification
    try {
      const valueInReais = (value / 100).toFixed(2).replace('.', ',');
      await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'PushinPay - PIX Gerado',
          text: `PIX Gerado com sucesso\n💰 Valor: R$ ${valueInReais}`,
        }),
      });
    } catch (pushErr) {
      console.error('Pushcut notification error:', pushErr);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error creating PIX:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
