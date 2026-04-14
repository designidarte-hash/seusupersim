import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const paidStatuses = new Set(['paid', 'completed', 'confirmed', 'approved']);

const normalizeStatus = (status?: string | null) =>
  typeof status === 'string' ? status.toLowerCase() : 'created';

const parseValue = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(JSON.stringify({ error: 'transactionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Query our own database for payment status (updated by webhook)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: localPayment, error } = await supabaseAdmin
      .from('pix_payments')
      .select('*')
      .eq('transaction_id', transactionId)
      .maybeSingle();

    if (error) {
      console.error('DB query error:', error);
    }

    const localStatus = normalizeStatus(localPayment?.status);
    if (paidStatuses.has(localStatus)) {
      return new Response(JSON.stringify(localPayment), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const PUSHINPAY_API_TOKEN = Deno.env.get('PUSHINPAY_API_TOKEN');

    if (PUSHINPAY_API_TOKEN) {
      const providerResponse = await fetch(`https://api.pushinpay.com.br/api/transactions/${transactionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${PUSHINPAY_API_TOKEN}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (providerResponse.ok) {
        const providerData = await providerResponse.json();
        const syncedPayment = {
          transaction_id: transactionId,
          status: normalizeStatus(providerData.status ?? localPayment?.status),
          payer_name: providerData.payer_name ?? localPayment?.payer_name ?? null,
          end_to_end_id: providerData.end_to_end_id ?? localPayment?.end_to_end_id ?? null,
          value: parseValue(providerData.value) ?? localPayment?.value ?? null,
          updated_at: new Date().toISOString(),
        };

        const { error: upsertError } = await supabaseAdmin
          .from('pix_payments')
          .upsert(syncedPayment, { onConflict: 'transaction_id' });

        if (upsertError) {
          console.error('DB sync error:', upsertError);
        }

        return new Response(JSON.stringify({ ...localPayment, ...syncedPayment }), {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (providerResponse.status !== 404) {
        console.error('PushInPay status lookup failed:', await providerResponse.text());
      }
    }

    return new Response(JSON.stringify(localPayment ?? { error: 'Payment not found', status: 'created' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking PIX:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
