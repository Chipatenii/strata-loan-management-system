import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    // Create a supabase client
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

    // Get User
    const {
        data: { user },
    } = await supabase.auth.getUser()

    const path = request.nextUrl.pathname

    // Auth Condition: if (!user) and accessing protected routes
    if (!user) {
        if (path.startsWith('/portal') || path.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
    }

    // Role Condition: if (user) but accessing generic root, redirect to portal
    // (We'll simplify: / => Landing. /portal => Customer. /admin => Admin.)

    if (user) {
        if (path === '/login' || path === '/register') {
            // Redirect to portal (or check role to redirect to admin)
            // For now, default to portal, dashboard will route them if needed.
            return NextResponse.redirect(new URL('/portal', request.url))
        }

        // Admin Protection
        if (path.startsWith('/admin')) {
            // Fetch user role from public.users
            // Note: Middleware shouldn't do DB calls usually, but we can check metadata if synced.
            // For MVP, we might rely on the page itself or a quick check. 
            // Better: use session custom claims if available, OR let the page handle 403.
            // For now, let's allow access and let the Page/Layout handle "Unauthorized" if role mismatch,
            // to avoid heavy DB in middleware. 
            // However, user Requirement said "Protect admin routes".
            // We will implement a server-side check in layouts.
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
         * - api/cron (allow cron jobs to bypass auth if needed, but best to protect with header check in route)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
