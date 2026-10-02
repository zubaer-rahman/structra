import { NextRequest, NextResponse } from 'next/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'

// Allowed roles for preview and sandbox demo evaluation
const DEMO_ROLES = {
  homeowner: {
    email: process.env.DEMO_HOMEOWNER_EMAIL || 'zubaer.rahman.cse@gmail.com',
    redirectUrl: '/homeowner/dashboard',
    label: 'Homeowner',
  },
  contractor: {
    email: process.env.DEMO_CONTRACTOR_EMAIL || 'khalidsaifullah.sok@gmail.com',
    redirectUrl: '/contractor/dashboard',
    label: 'Contractor',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@structra.com',
    redirectUrl: '/admin/identity-verification',
    label: 'Platform Admin',
  },
} as const

type DemoRoleKey = keyof typeof DEMO_ROLES

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const role = (body?.role || '').toLowerCase() as DemoRoleKey

    if (!role || !DEMO_ROLES[role]) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid demo role requested. Allowed roles: ${Object.keys(DEMO_ROLES).join(', ')}`,
        },
        { status: 400 }
      )
    }

    const demoConfig = DEMO_ROLES[role]
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !serviceRoleKey || !anonKey) {
      console.error('Missing Supabase configuration environment variables')
      return NextResponse.json(
        { success: false, error: 'Server auth configuration error' },
        { status: 500 }
      )
    }

    // 1. Service role client to generate an instant OTP token without sending email
    const adminClient = createSupabaseClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email: demoConfig.email,
    })

    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('Failed to generate demo magic link:', linkError?.message)
      return NextResponse.json(
        {
          success: false,
          error: linkError?.message || 'Failed to generate demo session token',
        },
        { status: 500 }
      )
    }

    // 2. Anon client to verify the OTP and retrieve full session tokens
    const anonClient = createSupabaseClient(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: sessionData, error: verifyError } = await anonClient.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    })

    if (verifyError || !sessionData?.session) {
      console.error('Failed to verify demo token:', verifyError?.message)
      return NextResponse.json(
        {
          success: false,
          error: verifyError?.message || 'Failed to exchange demo token for session',
        },
        { status: 500 }
      )
    }

    // 3. Prepare response with session data
    const response = NextResponse.json({
      success: true,
      role,
      roleLabel: demoConfig.label,
      email: demoConfig.email,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
        expires_in: sessionData.session.expires_in,
        expires_at: sessionData.session.expires_at,
        token_type: sessionData.session.token_type,
        user: sessionData.session.user,
      },
      redirectUrl: demoConfig.redirectUrl,
    })

    // 4. Synchronize cookies into NextResponse for SSR & Middleware
    const ssrClient = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    })

    await ssrClient.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    })

    return response
  } catch (err: any) {
    console.error('Unexpected error in demo-login API route:', err)
    return NextResponse.json(
      {
        success: false,
        error: err?.message || 'Internal server error processing demo login',
      },
      { status: 500 }
    )
  }
}
