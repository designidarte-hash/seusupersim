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
    let body: Record<string, any>;

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    }
    console.log('Webhook received:', JSON.stringify(body));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const transactionId = body.id;
    const status = body.status;

    if (!transactionId) {
      console.error('No transaction ID in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing transaction ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { error } = await supabaseAdmin.from('pix_payments').upsert({
      transaction_id: transactionId,
      status: status || 'paid',
      payer_name: body.payer_name || null,
      end_to_end_id: body.end_to_end_id || null,
      value: body.value || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'transaction_id' });

    if (error) {
      console.error('DB upsert error:', error);
      return new Response(JSON.stringify({ error: 'Database error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Payment ${transactionId} updated to status: ${status}`);

    if (status === 'paid' || status === 'completed') {
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
