import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
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
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname
    const userRole = user?.user_metadata?.role

    console.log('[Middleware] Path:', path, 'User:', user?.id ? 'Logged In' : 'Guest', 'Role:', userRole)

    // 1. Unauthenticated Users
    if (!user) {
        // Protected Admin Routes -> Admin Login
        if (path.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/auth/admin/login', request.url))
        }
        // Protected Portal Routes -> Customer Login
        if (path.startsWith('/portal')) {
            return NextResponse.redirect(new URL('/auth/customer/login', request.url))
        }
        // Legacy Redirects
        if (path === '/login') {
            return NextResponse.redirect(new URL('/auth/customer/login', request.url))
        }
        if (path === '/register') {
            return NextResponse.redirect(new URL('/auth/customer/sign-up', request.url))
        }
    }

    // 2. Authenticated Users
    if (user) {
        // Redirect away from Auth pages if already logged in, EXCEPT for reset-password pages
        // The reset link logs the user in, so they must be allowed to view the reset page to type new password.
        const isResetPage = path === '/auth/customer/reset-password' || path === '/auth/admin/reset-password'

        if ((path.startsWith('/auth') || path === '/login' || path === '/register') && !isResetPage) {
            if (userRole === 'admin') {
                return NextResponse.redirect(new URL('/admin', request.url))
            } else {
                return NextResponse.redirect(new URL('/portal', request.url))
            }
        }

        // Admin Route Protection
        if (path.startsWith('/admin') && userRole !== 'admin') {
            return NextResponse.redirect(new URL('/portal', request.url))
        }

        // Portal Route Protection (Admins shouldn't be in customer portal context)
        if (path.startsWith('/portal') && userRole === 'admin') {
            return NextResponse.redirect(new URL('/admin', request.url))
        }
    }

    return response
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
