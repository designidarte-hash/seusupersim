import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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

    const response = await fetch('https://api.pushinpay.com.br/api/pix/cashIn', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PUSHINPAY_API_TOKEN}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('PushInPay error:', JSON.stringify(data));
      return new Response(JSON.stringify({ error: data.message || `PushInPay API error [${response.status}]` }), {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
