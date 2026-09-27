import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') })
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function seedAdmin() {
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const firstName = 'Admin'
  const lastName = 'Structra'
  const fullName = `${firstName} ${lastName}`

  console.log(`\n🚀 Seeding admin account: ${adminEmail}...`)

  try {
    // 1. Check if user already exists in auth
    const { data: userList, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) {
      console.error('❌ Failed to list users:', listError.message)
      process.exit(1)
    }

    const existingAuthUser = userList.users.find(
      (u) => u.email?.toLowerCase() === adminEmail?.toLowerCase()
    )

    let userId: string

    if (existingAuthUser) {
      console.log(`ℹ️ User ${adminEmail} already exists in auth (ID: ${existingAuthUser.id}).`)
      userId = existingAuthUser.id

      // Update password and metadata to ensure valid login
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(userId, {
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          user_role: 'admin',
          full_name: fullName
        }
      })

      if (updateAuthError) {
        console.warn('⚠️ Warning updating auth user password/metadata:', updateAuthError.message)
      } else {
        console.log(`✅ Updated password and confirmed email for ${adminEmail}.`)
      }
    } else {
      // Create new user in auth
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
          user_role: 'admin',
          full_name: fullName
        }
      })

      if (createAuthError || !newAuthUser.user) {
        console.error('❌ Failed to create auth user:', createAuthError?.message)
        process.exit(1)
      }

      userId = newAuthUser.user.id
      console.log(`✅ Created auth user ${adminEmail} (ID: ${userId}).`)
    }

    // 2. Upsert user record into public.users
    const { data: dbUser, error: dbError } = await supabase
      .from('users')
      .upsert(
        {
          id: userId,
          email: adminEmail,
          first_name: firstName,
          last_name: lastName,
          full_name: fullName,
          user_role: 'admin',
          is_active: true,
          is_verified_email: true,
          user_agreed_to_terms: true,
          updated_at: new Date().toISOString()
        },
        { onConflict: 'id' }
      )
      .select()
      .single()

    if (dbError) {
      console.error('❌ Failed to upsert into public.users table:', dbError.message)
      if (dbError.message.includes('users_user_role_check') || dbError.code === '23514') {
        console.log('\n⚠️  The "users" table check constraint in PostgreSQL does not allow the "admin" role yet.')
        console.log('👉 Please run this SQL in your Supabase SQL Editor:\n')
        console.log(`
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_user_role_check;

ALTER TABLE public.users 
ADD CONSTRAINT users_user_role_check 
CHECK (user_role IN ('homeowner', 'contractor', 'admin', 'support'));

NOTIFY pgrst, 'reload schema';
`)
      }
      process.exit(1)
    }

    console.log(`✅ Upserted public.users record for ${adminEmail} with role: 'admin'.`)
    console.log('\n========================================')
    console.log('🎉 Admin account successfully created/updated!')
    console.log('========================================')
    console.log(`📧 Email:    ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log(`👑 Role:     admin`)
    console.log(`🌐 Login at: http://localhost:3000/login`)
    console.log('========================================\n')
  } catch (error) {
    console.error('❌ Unexpected error during admin seeding:', error)
    process.exit(1)
  }
}

seedAdmin()
