# Admin Account Setup Guide

This guide explains how to add admin accounts to your BuildReady application.

## 🎯 What's Already Built

Your auth system already supports admin accounts! Here's what's included:

✅ **Admin role defined** in `utils/constants/users.ts`  
✅ **Database schema** supports admin users  
✅ **Admin dashboard** pages exist at `/admin/*`  
✅ **Role-based routing** works for admins  
✅ **UI components** recognize admin users  

## 🚀 Quick Setup (3 Easy Steps)

### Step 1: Add Environment Variable

Add your Supabase service role key to `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

**How to get it:**
1. Go to your Supabase dashboard
2. Navigate to Settings → API
3. Copy the "service_role" key (not the anon key)

### Step 2: Create Your First Admin

Run the setup script:

```bash
node create-admin-account.js
```

This creates an admin account with:
- **Email:** `admin@buildready.com`
- **Password:** `AdminPassword123!`

### Step 3: Login and Test

1. Go to `http://localhost:3000/login`
2. Use the admin credentials above
3. You'll be redirected to `/admin/dashboard`
4. Navigate to `/admin/users` to create more admins

## 🔧 Alternative Setup Methods

### Method 1: Database Migration (Recommended for Production)

Run the SQL migration:

```sql
-- Execute migration_041_create_admin_account.sql in your Supabase SQL editor
-- This creates a default admin and a helper function
```

### Method 2: Manual Database Insert

If you prefer to create admins manually:

```sql
-- Use the create_admin_user function
SELECT create_admin_user(
  'your-email@example.com',
  'YourSecurePassword123!',
  'Your',
  'Name'
);
```

### Method 3: Admin Panel (After First Admin)

Once you have one admin account:
1. Login as admin
2. Go to `/admin/users`
3. Click "Add Admin" button
4. Fill out the form

## 🛡️ Security Features

### Admin-Only Access
- `/admin/*` routes are protected by middleware
- Non-admin users are redirected to their role dashboard
- Admin creation requires existing admin privileges

### Email Confirmation
- Admin accounts are auto-confirmed (no email verification needed)
- Regular users still need email confirmation

### Password Security
- Minimum 8 characters required
- Change default passwords after first login

## 📁 Files Added/Modified

### New Files:
- `migration_041_create_admin_account.sql` - Database migration
- `create-admin-account.js` - Setup script
- `ADMIN_SETUP_GUIDE.md` - This guide

### Modified Files:
- `server/modules/auth/index.ts` - Added `createAdmin` API endpoint
- `app/(dashboard)/admin/users/page.tsx` - Added admin creation UI
- `config/middleware.ts` - Added admin route protection
- `env.example` - Added service role key

## 🔍 How It Works

### 1. Authentication Flow
```
User signs up → Supabase Auth → Users table → Role-based redirect
```

### 2. Admin Creation Flow
```
Admin clicks "Add Admin" → API validates admin role → Creates auth user → Creates profile → Success
```

### 3. Route Protection
```
User visits /admin/* → Middleware checks auth → Checks user role → Allow/Redirect
```

## 🚨 Important Notes

### Environment Variables
- **Required:** `SUPABASE_SERVICE_ROLE_KEY` for admin operations
- **Optional:** All other existing variables remain the same

### Database Permissions
- The migration creates a `create_admin_user()` function
- Only authenticated users can execute it (admins can create other admins)

### Security Considerations
1. **Change default passwords** immediately
2. **Use strong passwords** for admin accounts
3. **Limit admin access** to trusted team members
4. **Monitor admin activity** through Supabase logs

## 🐛 Troubleshooting

### "Missing SUPABASE_SERVICE_ROLE_KEY"
- Add the service role key to your `.env.local` file
- Restart your development server

### "Only admins can create admin accounts"
- You need an existing admin account first
- Use the setup script or database migration

### "Failed to create admin user"
- Check Supabase service role key is correct
- Ensure database permissions are set up
- Check Supabase logs for detailed errors

### Admin can't access admin routes
- Clear browser cookies and login again
- Check user role in database: `SELECT user_role FROM users WHERE email = 'your-email'`

## 🎉 You're All Set!

Your admin system is now ready. Admins can:
- ✅ Access admin dashboard at `/admin/dashboard`
- ✅ Manage users at `/admin/users`
- ✅ View analytics at `/admin/analytics`
- ✅ Create new admin accounts
- ✅ Access all admin features

## 📞 Need Help?

If you encounter issues:
1. Check the troubleshooting section above
2. Verify all environment variables are set
3. Check Supabase logs for detailed error messages
4. Ensure database migrations have been run
