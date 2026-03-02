-- Demo seed scheduler (Supabase pg_cron)
-- Runs hourly and seeds only when local business timezone hour is 00.

CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
DECLARE
  v_job_id BIGINT;
BEGIN
  FOR v_job_id IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'demo-seed-hourly'
  LOOP
    PERFORM cron.unschedule(v_job_id);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'demo-seed-hourly',
  '5 * * * *',
  $$SELECT public.run_scheduled_demo_seed();$$
);
