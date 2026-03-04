-- Fix: PostgREST on_conflict requires a UNIQUE CONSTRAINT, not just a UNIQUE INDEX.
-- Drop the partial unique index and add a proper unique constraint.

DROP INDEX IF EXISTS idx_companies_ac_debtor_code;

ALTER TABLE public.companies
DROP CONSTRAINT IF EXISTS uq_companies_autocount_debtor_code;

ALTER TABLE public.companies
ADD CONSTRAINT uq_companies_autocount_debtor_code UNIQUE (autocount_debtor_code);
