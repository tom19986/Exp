# Push Notifications Setup (Daily Reminder)

This app can send a real push notification — "Don't forget to log today's
expenses" — even when the browser/tab is closed. Here's everything needed
to turn it on.

## How it works

1. The app is a installable PWA (manifest + service worker in `public/`).
2. When a user enables reminders, the browser creates a **push subscription**
   (a unique endpoint + encryption keys) and it's saved to the
   `push_subscriptions` table in Supabase.
3. A Supabase **Edge Function** (`supabase/functions/send-daily-reminder`)
   runs every hour via a scheduled cron job. Each run, it checks which
   subscriptions want a reminder at the current hour (IST) and sends them
   a push using the **Web Push protocol**.
4. The device's OS/browser delivers it to the service worker, which shows
   the notification — the app doesn't need to be open.

## 1. Generate VAPID keys (already done for you)

Web Push requires a VAPID key pair to authenticate your server to push
services (Google/Apple/Mozilla's push infra). These were generated for
this project:

```
Public Key:
BO4XOKH05Cuwqj_sdEunQ1ZbpovWDa9qsk_sB-8KTBb5JxwYNUaRdPH_69RdSGnE46wSPsWlDM_Vdglbf5kXkqI

Private Key:
I-i5-zPAAvzq217YK2zS3BQZVlTfM_iMxcNd8NtUdZc
```

> Keep the private key secret — it goes only into Supabase Edge Function
> secrets, never into `.env` or client code. If you'd rather generate
> your own pair: `npx web-push generate-vapid-keys`.

## 2. Add the public key to your app

In `.env`:
```
VITE_VAPID_PUBLIC_KEY=BO4XOKH05Cuwqj_sdEunQ1ZbpovWDa9qsk_sB-8KTBb5JxwYNUaRdPH_69RdSGnE46wSPsWlDM_Vdglbf5kXkqI
```

## 3. Run the updated schema

Run the `push_subscriptions` table + policies section of `supabase/schema.sql`
if you're on an existing database (or just re-run the whole file — the
`drop ... cascade` cleanup at the top handles re-runs safely, but note
that will also wipe existing data; if you have real data already, only
run the new `push_subscriptions` block manually instead).

## 4. Install the Supabase CLI and deploy the Edge Function

```bash
npm install -g supabase
supabase login
cd expense-manager
supabase link --project-ref uqoljdyziwirypzhlymo

# Set secrets the function needs (server-side only)
supabase secrets set VAPID_PUBLIC_KEY=BO4XOKH05Cuwqj_sdEunQ1ZbpovWDa9qsk_sB-8KTBb5JxwYNUaRdPH_69RdSGnE46wSPsWlDM_Vdglbf5kXkqI
supabase secrets set VAPID_PRIVATE_KEY=I-i5-zPAAvzq217YK2zS3BQZVlTfM_iMxcNd8NtUdZc
supabase secrets set VAPID_SUBJECT=mailto:you@example.com

# Deploy
supabase functions deploy send-daily-reminder
```

## 5. Schedule it to run hourly

Open `supabase/schedule.sql`, replace `YOUR_SUPABASE_SERVICE_ROLE_KEY`
with your actual **service role key** (Project Settings → API →
`service_role` secret — not the anon key), then run the file in the SQL
Editor.

This sets up an hourly cron job. The function itself only sends to
subscriptions whose chosen reminder hour matches the current hour in IST,
so one hourly job covers every user's chosen time.

## 6. Try it end to end

1. `npm install && npm run dev`, open the app on your phone (or desktop
   Chrome/Edge).
2. **Important for iPhone**: Safari only supports push for sites
   **added to the Home Screen**. Open the site in Safari → Share →
   "Add to Home Screen" → open it from that icon → then enable
   notifications. Desktop Chrome, Android Chrome, and Firefox support it
   directly in the browser tab, no install needed (though installing is
   still recommended).
3. Go to **More → Notifications**, pick a reminder time, tap **Enable
   daily reminder**, and allow the permission prompt.
4. To test immediately without waiting for the top of the hour, you can
   manually invoke the function from the Supabase dashboard
   (Edge Functions → send-daily-reminder → Invoke), or via curl:
   ```bash
   curl -X POST https://uqoljdyziwirypzhlymo.supabase.co/functions/v1/send-daily-reminder \
     -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"
   ```
   (Set your subscription's reminder hour to the current IST hour first,
   or temporarily hardcode the hour check in the function for testing.)

## Limitations to know about

- **iOS requires "Add to Home Screen"** — Safari won't grant push
  permission to a regular browser tab, only to an installed PWA, and
  needs iOS 16.4+.
- Reminders are **per device/browser** — if the same person uses the app
  on two phones, they need to enable it on each.
- If a push fails because a subscription is no longer valid (user
  uninstalled, cleared data, etc.), the function automatically removes
  it from the database on the next run.
