# HomeFin — Family Finances

Home finances GPlay app. Shared household ledger for income and expenses. You and your wife sign in from any phone. Data lives in **Supabase**. Host it at **`finances.craftkip.com`**.

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
4. **Authentication → Providers → Email**: turn **off** “Confirm email”.
5. After both household accounts exist, turn **off** “Allow new users to sign up”. The database also rejects any third account.
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

Open [http://localhost:3000](http://localhost:3000) and **sign in**. Signup is closed; only the two existing household accounts can log in.

## 3. Host on `finances.craftkip.com`

Easiest path: **Vercel** (free). This app is on GitHub at [PirateCom/HomeFin](https://github.com/PirateCom/HomeFin). The main CraftKip site on SkyHost stays as it is; only this subdomain points at Vercel.

1. Create a free account at [vercel.com](https://vercel.com) and sign in with GitHub.
2. **Add New → Project** → import `HomeFin`.
3. Add env vars (same as `.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy. You’ll get a URL like `homefin.vercel.app` first.
5. In **SkyHost / cPanel → Zone Editor** (nameservers are `ns1.skyhost.ro`):
   - Type: **CNAME**
   - Name: **finances**
   - Target: `cname.vercel-dns.com`
6. In Vercel → Project → Settings → Domains: add `finances.craftkip.com`.
7. In Supabase → Authentication → URL configuration:
   - Site URL: `https://finances.craftkip.com`
   - Redirect URLs: `https://finances.craftkip.com/**` and `http://localhost:3000/**`

## 4. Phones

Open `https://finances.craftkip.com`, sign in, then:

- **iPhone:** Share → Add to Home Screen
- **Android:** browser menu → Add to Home Screen / Install app

Both of you see the same transactions. Each entry stores who added it.

## Stack

Next.js 15, Tailwind CSS, Supabase Auth + Postgres.
