-- Create a company queue table for tracking bulk scan submissions
CREATE TABLE IF NOT EXISTS public.company_queue (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scan_id text NOT NULL UNIQUE,
  company_name text NOT NULL,
  domain text NOT NULL,
  tags text[],
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'failed')),
  queued_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  error_message text,
  batch_id text, -- For grouping companies from the same batch
  priority integer DEFAULT 0, -- Higher number = higher priority
  retry_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_company_queue_status ON public.company_queue(status);
CREATE INDEX idx_company_queue_domain ON public.company_queue(domain);
CREATE INDEX idx_company_queue_batch_id ON public.company_queue(batch_id);
CREATE INDEX idx_company_queue_queued_at ON public.company_queue(queued_at);
CREATE INDEX idx_company_queue_priority_queued ON public.company_queue(priority DESC, queued_at ASC) WHERE status = 'queued';

-- Unique constraint to prevent duplicate entries for same company+domain combination
CREATE UNIQUE INDEX idx_company_queue_unique_company_domain ON public.company_queue(company_name, domain);

-- Trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_company_queue_updated_at 
BEFORE UPDATE ON public.company_queue 
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.company_queue ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Enable all operations for authenticated users" ON public.company_queue
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create a view for queue statistics
CREATE OR REPLACE VIEW public.company_queue_stats AS
SELECT 
  status,
  COUNT(*) as count,
  MIN(queued_at) as oldest_queued,
  MAX(queued_at) as newest_queued,
  AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, now()) - queued_at))) as avg_processing_time_seconds
FROM public.company_queue
GROUP BY status;

-- Function to get next batch of companies from queue
CREATE OR REPLACE FUNCTION get_next_company_batch(batch_size integer DEFAULT 10)
RETURNS TABLE(
  id uuid,
  scan_id text,
  company_name text,
  domain text,
  tags text[]
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.company_queue q
  SET 
    status = 'processing',
    started_at = now()
  FROM (
    SELECT cq.id
    FROM public.company_queue cq
    WHERE cq.status = 'queued'
    ORDER BY cq.priority DESC, cq.queued_at ASC
    LIMIT batch_size
    FOR UPDATE SKIP LOCKED
  ) AS selected
  WHERE q.id = selected.id
  RETURNING q.id, q.scan_id, q.company_name, q.domain, q.tags;
END;
$$ LANGUAGE plpgsql;

-- Function to mark scan as completed
CREATE OR REPLACE FUNCTION complete_queued_scan(p_scan_id text)
RETURNS void AS $$
BEGIN
  UPDATE public.company_queue
  SET 
    status = 'completed',
    completed_at = now()
  WHERE scan_id = p_scan_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark scan as failed
CREATE OR REPLACE FUNCTION fail_queued_scan(p_scan_id text, p_error_message text)
RETURNS void AS $$
BEGIN
  UPDATE public.company_queue
  SET 
    status = 'failed',
    completed_at = now(),
    error_message = p_error_message,
    retry_count = retry_count + 1
  WHERE scan_id = p_scan_id;
END;
$$ LANGUAGE plpgsql;