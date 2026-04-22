import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SIGMAPAY_BASE_URL = 'https://api.sigmapay.com.br/api/public/v1';

const paidStatuses = new Set(['paid', 'completed', 'confirmed', 'approved']);

const normalizeStatus = (status?: string | null): string => {
  if (typeof status !== 'string') return 'created';
  const s = status.toLowerCase();
  // SigmaPay statuses: waiting_payment, paid, cancelled, refused, refunded, chargeback
  if (s === 'waiting_payment' || s === 'pending') return 'created';
  return s;
};

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
    const body = await req.json();
    // SigmaPay uses lowercase hashes (e.g. tqjmwf0x8b)
    const rawId = typeof body.transactionId === 'string' ? body.transactionId : '';
    if (!rawId) {
      return new Response(JSON.stringify({ error: 'transactionId is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const transactionIdLower = rawId.toLowerCase();

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: localPayment, error } = await supabaseAdmin
      .from('pix_payments')
      .select('*')
      .eq('transaction_id', transactionIdLower)
      .maybeSingle();

    if (error) console.error('DB query error:', error);

    const localStatus = normalizeStatus(localPayment?.status);
    if (paidStatuses.has(localStatus)) {
      return new Response(JSON.stringify(localPayment), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const SIGMAPAY_API_TOKEN = Deno.env.get('SIGMAPAY_API_TOKEN');

    if (SIGMAPAY_API_TOKEN) {
      const res = await fetch(`${SIGMAPAY_BASE_URL}/transactions/${encodeURIComponent(transactionIdLower)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SIGMAPAY_API_TOKEN}`,
          'Accept': 'application/json',
        },
      });

      if (res.ok) {
        const providerData = await res.json();
        if (providerData?.hash) {
          const syncedPayment = {
            transaction_id: transactionIdLower,
            status: normalizeStatus(providerData.payment_status ?? localPayment?.status),
            end_to_end_id: providerData.transaction ?? localPayment?.end_to_end_id ?? null,
            value: parseValue(providerData.amount) ?? localPayment?.value ?? null,
            updated_at: new Date().toISOString(),
          };

          const { error: upsertError } = await supabaseAdmin
            .from('pix_payments')
            .upsert(syncedPayment, { onConflict: 'transaction_id' });

          if (upsertError) console.error('DB sync error:', upsertError);

          return new Response(JSON.stringify({ ...localPayment, ...syncedPayment }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (res.status !== 404) {
        console.error('SigmaPay status lookup failed:', res.status, await res.text());
      } else {
        await res.text();
      }
    }

    return new Response(JSON.stringify(localPayment ?? { error: 'Payment not found', status: 'created' }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error checking PIX:', error);
    return new Response(JSON.stringify({ error: (error as Error).message || 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
