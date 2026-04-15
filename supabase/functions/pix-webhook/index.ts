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
    const contentType = req.headers.get('content-type') || '';
    let body: Record<string, any>;

    if (contentType.includes('application/json')) {
      body = await req.json();
    } else {
      // PushInPay sends form-urlencoded data
      const text = await req.text();
      const params = new URLSearchParams(text);
      body = Object.fromEntries(params.entries());
    }
    console.log('Webhook received:', JSON.stringify(body));

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // PushInPay sends the transaction data in the webhook
    const transactionId = body.id;
    const status = body.status;

    if (!transactionId) {
      console.error('No transaction ID in webhook payload');
      return new Response(JSON.stringify({ error: 'Missing transaction ID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Upsert payment status
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

    // Send Pushcut notification for paid status
    if (status === 'paid' || status === 'completed') {
      try {
        const valueInReais = body.value ? (Number(body.value) / 100).toFixed(2).replace('.', ',') : '0,00';
        await fetch('https://api.pushcut.io/Ee028sYTepada_oEeEk6n/notifications/MinhaNotifica%C3%A7%C3%A3o', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: 'PushinPay - Venda Paga',
            text: `Venda Aprovada\nValor: R$ ${valueInReais}`,
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
