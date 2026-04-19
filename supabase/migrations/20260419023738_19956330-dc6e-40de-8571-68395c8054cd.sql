UPDATE public.pix_payments
SET status = 'cancelled',
    updated_at = now()
WHERE status NOT IN ('paid','cancelled','refunded','failed','expired');