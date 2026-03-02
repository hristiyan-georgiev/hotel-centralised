-- Initial baseline run for demo sandbox data
-- Safe to rerun due to idempotency in seed_demo_day + demo_seed_runs.

SELECT public.seed_demo_baseline();
