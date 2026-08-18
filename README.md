# Expense Manager (React + Supabase)

A multi-user expense/income tracker with dynamic categories & sub-categories,
channel-based access (1 admin + members), date-range filtering, and a
reports dashboard with charts (income vs expense, savings rate, category
breakdown).

## 1. Set up Supabase

1. Create a project at https://supabase.com.
2. Go to **SQL Editor** → paste the contents of `supabase/schema.sql` → **Run**.
   This creates all tables, the `handle_new_user` trigger, and Row Level
   Security policies scoping every table to a user's channel.
3. Go to **Authentication → Providers** and make sure **Email** is enabled.
   For quick local testing you can turn off "Confirm email" under
   Authentication → Settings.
4. Go to **Project Settings → API** and copy the **Project URL** and
   **anon public** key.

## 2. Configure the app

```bash
cp .env.example .env
```
Fill in:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=xxxxxxxx
```

## 3. Install & run

```bash
npm install
npm run dev
```
Open http://localhost:5173

## How the multi-user "channel" flow works

- The **first user** signs up, then on the onboarding screen chooses
  **"Create channel (Admin)"** — this makes them the channel admin and
  generates a 6-character **join code**.
- The admin shares the join code (visible any time under **Channel Admin**
  in the sidebar) with up to as many teammates as you want (e.g. 2 users).
- Each teammate signs up normally, then on the onboarding screen chooses
  **"Join with code"** and enters it. They're now in the same channel.
- Everyone in a channel shares the same **categories/sub-categories** and
  can see each other's transactions, filtered by member on Dashboard,
  Expenses, and Reports pages ("Overall" / "Me" / teammate name).
- Row Level Security in `schema.sql` enforces that a user can only ever
  read/write data belonging to their own channel, and can only edit or
  delete their own transactions.

> Note: Because this app uses only the public anon key (no server-side
> admin key), the admin can't directly create login credentials for other
> people — each person creates their own account and joins with the code.
> If you'd rather have the admin provision accounts directly, that requires
> a Supabase Edge Function using the service-role key — ask if you'd like
> that added.

## Pages

- **Dashboard** – summary cards (income, expense, balance, savings rate),
  pie chart of expense by category, bar chart of income/expense by member,
  recent transactions, date range + member filter.
- **Add Expense** – income/expense toggle, category → sub-category cascading
  dropdowns (e.g. select "Bills" → choose Gas / Recharge / Electricity),
  amount, date, description.
- **Expenses** – full list with filters: date range, type, member, category,
  sub-category, description search; delete your own entries.
- **Categories** – create categories (e.g. Outside Food, Groceries, Sent To,
  Receive From, Bills) tagged as income/expense, and add sub-categories
  under each.
- **Reports** – income vs expense trend, savings rate over time, expense
  share by category (pie), monthly net bar chart, top sub-categories by
  spend. All filterable by date range and member.
- **Channel Admin** (admin only) – view/copy join code, see and remove
  members.

## Tech stack

- React 18 + React Router 6 (Vite)
- Supabase (Postgres + Auth + Row Level Security)
- Recharts for all charts
- Plain CSS (no framework) for a lightweight, easily-customizable UI
