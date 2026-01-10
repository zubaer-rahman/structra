import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  const { data: { user } } = await supabase.auth.getUser()

  // Check if user is trying to access admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    if (!user) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Check if user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('user_role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.user_role !== 'admin') {
      // Redirect to appropriate dashboard if not admin
      const redirectPath = userData?.user_role === 'contractor' ? '/contractor/dashboard' : '/homeowner/dashboard'
      return NextResponse.redirect(new URL(redirectPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}