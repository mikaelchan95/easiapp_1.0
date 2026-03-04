-- Sync infrastructure tables for EASI AutoCount Bridge.
-- Tracks sync jobs (debtor sync, invoice posting, etc.) and per-record errors.

-- sync_jobs: one row per sync run
CREATE TABLE IF NOT EXISTS public.sync_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL,            -- e.g. 'debtor_sync', 'invoice_post', 'payment_post'
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    records_processed INT DEFAULT 0,
    records_synced INT DEFAULT 0,
    records_failed INT DEFAULT 0,
    error_message TEXT,                        -- top-level error if the whole job failed
    metadata JSONB DEFAULT '{}',              -- flexible bag for extra context (e.g. source DB, filters)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON public.sync_jobs (status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_type_created ON public.sync_jobs (job_type, created_at DESC);

-- sync_errors: per-record errors within a job
CREATE TABLE IF NOT EXISTS public.sync_errors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.sync_jobs(id) ON DELETE CASCADE,
    entity VARCHAR(50) NOT NULL,              -- e.g. 'debtor', 'invoice', 'payment'
    record_key VARCHAR(255) NOT NULL,         -- the AC AccNo, invoice number, etc.
    error_message TEXT NOT NULL,
    error_detail TEXT,                         -- stack trace or extra context
    retry_count INT DEFAULT 0,
    resolved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sync_errors_job ON public.sync_errors (job_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_unresolved ON public.sync_errors (resolved, created_at DESC)
    WHERE resolved = FALSE;

-- autocount_debtor_code on companies: links a Supabase company to its AutoCount debtor AccNo
ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS autocount_debtor_code VARCHAR(30);

CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_ac_debtor_code
    ON public.companies (autocount_debtor_code)
    WHERE autocount_debtor_code IS NOT NULL;

-- updated_at trigger for sync_jobs
CREATE OR REPLACE FUNCTION public.sync_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_jobs_updated_at ON public.sync_jobs;
CREATE TRIGGER trg_sync_jobs_updated_at
    BEFORE UPDATE ON public.sync_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_jobs_updated_at();

-- RLS: sync tables are service-only (bridge uses service_role key, bypasses RLS).
-- Enable RLS but create no user-facing policies so normal users can't see sync data.
ALTER TABLE public.sync_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_errors ENABLE ROW LEVEL SECURITY;
