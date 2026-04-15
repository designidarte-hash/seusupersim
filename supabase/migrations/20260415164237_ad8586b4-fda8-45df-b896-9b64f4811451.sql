
CREATE TABLE public.completed_cpfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cpf_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Allow anonymous inserts and selects (no auth required)
ALTER TABLE public.completed_cpfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert completed CPFs"
ON public.completed_cpfs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can read completed CPFs"
ON public.completed_cpfs FOR SELECT
TO anon, authenticated
USING (true);
