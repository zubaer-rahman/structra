# Admin Account Setup

## What's Pre-built

The admin system ships fully wired:

- `admin` role defined in `utils/constants/users.ts`
- `/admin/*` routes exist and are protected by middleware
- Admin dashboard, user management, and analytics pages are live
- Admin-only tRPC procedures on the server

## Quick Setup (3 Steps)

### Step 1 — Add the Service Role Key

In `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

Get it from: **Supabase Dashboard → Settings → API → service_role key**.

### Step 2 — Seed the First Admin

```bash
node create-admin-account.js
```

Default credentials created:
- **Email:** `admin@structra.com`
- **Password:** `AdminPassword123!`

Change these immediately after first login.

### Step 3 — Verify Access

1. Navigate to `http://localhost:3000/login`
2. Log in with admin credentials
3. You should be redirected to `/admin/dashboard`

## Alternative: SQL Migration

```sql
SELECT create_admin_user(
  'your@email.com',
  'SecurePassword123!',
  'First',
  'Last'
);
```

Run this in the Supabase SQL Editor after the `041_create_admin_account` migration has been applied.

## How Route Protection Works

```
Request to /admin/* 
  → Middleware checks Supabase session
  → Fetches user.user_role from DB
  → Role === 'admin' → allow
  → Role !== 'admin' → redirect to /dashboard
```

## Security Notes

- Admin creation requires an existing admin session (or the seed script)
- Admin accounts bypass email confirmation — set strong passwords
- All admin actions are logged via Supabase audit

## Troubleshooting

| Error | Solution |
|---|---|
| `Missing SUPABASE_SERVICE_ROLE_KEY` | Add key to `.env.local`, restart server |
| `Only admins can create admin accounts` | Use the seed script for the first admin |
| Admin can't access `/admin/*` | Clear cookies, verify `user_role = 'admin'` in DB |
