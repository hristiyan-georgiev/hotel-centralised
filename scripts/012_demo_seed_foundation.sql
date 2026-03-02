-- Demo seeding foundation
-- Creates sandbox seed settings, idempotency tracking, and helper utilities.

CREATE TABLE IF NOT EXISTS public.demo_seed_settings (
  singleton BOOLEAN PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled BOOLEAN NOT NULL DEFAULT true,
  business_timezone TEXT NOT NULL DEFAULT 'UTC',
  days_to_backfill INTEGER NOT NULL DEFAULT 14 CHECK (days_to_backfill BETWEEN 0 AND 90),
  retain_days INTEGER NOT NULL DEFAULT 90 CHECK (retain_days BETWEEN 7 AND 365),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.demo_seed_settings (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.demo_seed_runs (
  seed_date DATE PRIMARY KEY,
  seed_type TEXT NOT NULL CHECK (seed_type IN ('baseline', 'daily', 'manual')),
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  counts JSONB NOT NULL DEFAULT '{}'::JSONB
);

CREATE OR REPLACE FUNCTION public.random_choice(options anyarray)
RETURNS anyelement
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  idx INTEGER;
BEGIN
  IF options IS NULL OR array_length(options, 1) IS NULL THEN
    RETURN NULL;
  END IF;

  idx := 1 + FLOOR(random() * array_length(options, 1))::INTEGER;
  RETURN options[idx];
END;
$$;

CREATE OR REPLACE FUNCTION public.random_timestamptz_on_date(
  target_date DATE,
  min_hour INTEGER DEFAULT 0,
  max_hour INTEGER DEFAULT 23
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_min_hour INTEGER := GREATEST(0, LEAST(23, COALESCE(min_hour, 0)));
  v_max_hour INTEGER := GREATEST(0, LEAST(23, COALESCE(max_hour, 23)));
  v_start TIMESTAMPTZ;
  v_end TIMESTAMPTZ;
  v_seconds INTEGER;
BEGIN
  IF target_date IS NULL THEN
    RETURN NOW();
  END IF;

  IF v_max_hour < v_min_hour THEN
    v_max_hour := v_min_hour;
  END IF;

  v_start := (target_date::TIMESTAMP + make_interval(hours => v_min_hour)) AT TIME ZONE 'UTC';
  v_end := (target_date::TIMESTAMP + make_interval(hours => v_max_hour, mins => 59, secs => 59)) AT TIME ZONE 'UTC';
  v_seconds := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_end - v_start)))::INTEGER);

  RETURN v_start + make_interval(secs => FLOOR(random() * (v_seconds + 1))::INTEGER);
END;
$$;

CREATE OR REPLACE FUNCTION public.random_timestamptz_between(
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ
)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_start TIMESTAMPTZ := COALESCE(start_at, NOW());
  v_end TIMESTAMPTZ := COALESCE(end_at, NOW());
  v_seconds INTEGER;
BEGIN
  IF v_end < v_start THEN
    v_end := v_start;
  END IF;

  v_seconds := GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (v_end - v_start)))::INTEGER);
  RETURN v_start + make_interval(secs => FLOOR(random() * (v_seconds + 1))::INTEGER);
END;
$$;
