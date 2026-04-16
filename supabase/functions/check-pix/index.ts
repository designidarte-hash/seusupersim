import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const paidStatuses = new Set(['paid', 'completed', 'confirmed', 'approved']);

const normalizeStatus = (status?: string | null): string => {
  if (typeof status !== 'string') return 'created';
  const s = status.toLowerCase();
  // BlackCat statuses: PENDING, PAID, CANCELLED, REFUNDED
  if (s === 'pending') return 'created';
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
    // BlackCat IDs are case-sensitive (e.g. TXN-...) — preserve original case for upstream calls,
    // but match local records on lowercase since we store them normalized.
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

    const BLACKCAT_API_KEY = Deno.env.get('BLACKCAT_API_KEY');

    if (BLACKCAT_API_KEY) {
      // Try original case first, fallback to upper if not found
      const tryIds = [rawId, rawId.toUpperCase()];
      let providerData: Record<string, any> | null = null;

      for (const id of tryIds) {
        const res = await fetch(`https://api.blackcatpay.com.br/api/sales/${encodeURIComponent(id)}/status`, {
          method: 'GET',
          headers: {
            'X-API-Key': BLACKCAT_API_KEY,
            'Accept': 'application/json',
          },
        });
        if (res.ok) {
          const json = await res.json();
          if (json?.success && json?.data) {
            providerData = json.data;
            break;
          }
        } else if (res.status !== 404) {
          console.error('BlackCat status lookup failed:', res.status, await res.text());
        }
      }

      if (providerData) {
        const syncedPayment = {
          transaction_id: transactionIdLower,
          status: normalizeStatus(providerData.status ?? localPayment?.status),
          end_to_end_id: providerData.endToEndId ?? localPayment?.end_to_end_id ?? null,
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
