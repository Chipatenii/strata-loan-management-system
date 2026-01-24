import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    console.log('[Auth Callback] Code present:', !!code, 'Next:', next)

    if (code) {
        const cookieStore = {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                cookiesToSet.forEach(({ name, value, options }) =>
                    request.cookies.set(name, value)
                )
            },
        }

        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: cookieStore,
            }
        )

        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Forward to the "next" path (e.g. /auth/customer/reset-password)
            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
