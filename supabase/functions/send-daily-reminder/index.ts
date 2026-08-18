// supabase/functions/send-daily-reminder/index.ts
//
// Scheduled Edge Function: finds every push subscription whose
// reminder_hour_ist matches the current hour in IST, and sends each
// one a Web Push notification reminding the user to log today's
// expenses. Runs even if no browser tab is open — the OS/browser
// wakes the service worker to show the notification.
//
// Deploy:   supabase functions deploy send-daily-reminder
// Secrets:  supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com
// Schedule: see supabase/schedule.sql — runs this every hour via pg_cron + pg_net

import { createClient } from 'npm:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@example.com'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

function currentHourIST() {
  // IST = UTC+5:30, no DST
  const now = new Date()
  const istMillis = now.getTime() + (5 * 60 + 30) * 60 * 1000
  const ist = new Date(istMillis)
  return ist.getUTCHours()
}

Deno.serve(async (_req) => {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
  const hour = currentHourIST()

  const { data: subs, error } = await supabase
    .from('push_subscriptions')
    .select('*')
    .eq('reminder_hour_ist', hour)

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  const payload = JSON.stringify({
    title: 'ExpenseLy reminder',
    body: "Don't forget to log today's income and expenses.",
    url: '/add',
    tag: 'daily-reminder'
  })

  const results = await Promise.allSettled(
    (subs || []).map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth_key }
        },
        payload
      )
    )
  )

  // Clean up subscriptions that are no longer valid (expired/unsubscribed)
  const toDelete: string[] = []
  results.forEach((r, i) => {
    if (r.status === 'rejected') {
      const statusCode = r.reason?.statusCode
      if (statusCode === 404 || statusCode === 410) {
        toDelete.push(subs[i].endpoint)
      }
    }
  })
  if (toDelete.length > 0) {
    await supabase.from('push_subscriptions').delete().in('endpoint', toDelete)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.length - sent

  return new Response(JSON.stringify({ hour, matched: subs?.length || 0, sent, failed }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
