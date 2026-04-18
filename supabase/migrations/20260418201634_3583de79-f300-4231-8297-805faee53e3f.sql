CREATE TABLE public.pix_validations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cpf TEXT,
  customer_name TEXT,
  pix_key TEXT NOT NULL,
  pix_key_type TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0.01,
  status TEXT NOT NULL DEFAULT 'pending',
  withdrawal_id TEXT,
  blackcat_response JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pix_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read pix validations"
ON public.pix_validations FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow service role full access pix validations"
ON public.pix_validations FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

CREATE INDEX idx_pix_validations_cpf ON public.pix_validations(cpf);
CREATE INDEX idx_pix_validations_withdrawal_id ON public.pix_validations(withdrawal_id);