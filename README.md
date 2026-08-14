# HomeFin — Family Finances

Home finances GPlay app. Shared household ledger for income and expenses. You and your wife sign in from any phone. Data lives in **Supabase**. Host it at **`finances.<your-domain>`**.

## What you get

- Mobile-first app (Add to Home Screen)
- Shared income / expense ledger with categories
- Monthly totals and history
- Two users, same household data
- Default currency **SEK** (RON and EUR in Settings)

## 1. Create a new Supabase project

Do **not** reuse the Tocab store project.

1. Open [https://supabase.com](https://supabase.com) → New project.
2. SQL Editor → paste and run [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql), then [`supabase/migrations/002_users.sql`](supabase/migrations/002_users.sql), then [`supabase/migrations/003_currency_sek.sql`](supabase/migrations/003_currency_sek.sql), then [`supabase/migrations/004_savings.sql`](supabase/migrations/004_savings.sql) (savings accounts).
3. **Authentication → Providers → Email**: leave email/password on.
4. **Authentication → Providers → Email**: turn **off** “Confirm email” so signup logs you in immediately.
5. Leave **Allow new users to sign up** **on**. Each person creates their own account the first time they open the app.
6. Copy **Project URL** and **anon public** key from **Project Settings → API**.

## 2. Run locally

```bash
cd family-finances
cp .env.local.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and **sign up** (username, email, password). After that you stay logged in.

If you created users **before** running the SQL, open the app once anyway — the profile row is created on first use.

## 3. Host on `finances.<your-domain>`

Easiest path: **Vercel** (free for this).

1. Push this folder to GitHub (or deploy from the Vercel CLI).
2. Import the project in Vercel. Add the same two env vars.
3. After the first deploy, copy the Vercel URL (like `family-finances.vercel.app`).
4. At your domain registrar / DNS:
   - Type: **CNAME**
   - Name: **finances**
   - Target: the Vercel CNAME they show (often `cname.vercel-dns.com`)
5. In Vercel → Project → Settings → Domains: add `finances.your-domain.com`.
6. In Supabase → Authentication → URL configuration:
   - Site URL: `https://finances.your-domain.com`
   - Redirect URLs: `https://finances.your-domain.com/**` and `http://localhost:3000/**`

## 4. Phones

Open `https://finances.your-domain.com`, sign in, then:

- **iPhone:** Share → Add to Home Screen
- **Android:** browser menu → Add to Home Screen / Install app

Both of you see the same transactions. Each entry stores who added it.

## Stack

Next.js 15, Tailwind CSS, Supabase Auth + Postgres.
