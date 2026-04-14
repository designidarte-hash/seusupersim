CREATE TABLE public.pix_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'created',
  value INTEGER,
  payer_name TEXT,
  end_to_end_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pix_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read by transaction_id" ON public.pix_payments
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow service role insert/update" ON public.pix_payments
  FOR ALL TO service_role USING (true) WITH CHECK (true);