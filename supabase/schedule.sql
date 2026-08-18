-- ============================================================
-- SCHEDULE THE DAILY REMINDER EDGE FUNCTION
-- Run this in the Supabase SQL Editor AFTER deploying the
-- send-daily-reminder function (see supabase/functions/).
-- ============================================================

-- Enable required extensions (usually already on for Supabase projects)
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Runs at the top of every hour. The function itself checks which
-- subscriptions have reminder_hour_ist == current IST hour and only
-- sends to those, so this single hourly cron covers all reminder times.
select cron.schedule(
  'send-daily-reminder-hourly',
  '0 * * * *',
  $$
  select net.http_post(
    url := 'https://uqoljdyziwirypzhlymo.supabase.co/functions/v1/send-daily-reminder',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To check scheduled jobs:
-- select * from cron.job;

-- To remove this schedule later:
-- select cron.unschedule('send-daily-reminder-hourly');
