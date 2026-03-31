import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/'

    console.log('[Auth Callback] Code present:', !!code, 'Next:', next)

    if (code) {
        // Track cookies that need to be set on the response
        const cookiesToSetOnResponse: { name: string, value: string, options: CookieOptions }[] = []

        const cookieStore = {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet: { name: string, value: string, options: CookieOptions }[]) {
                cookiesToSet.forEach(({ name, value }) =>
                    request.cookies.set(name, value)
                )
                // Accumulate cookies to set on the response later
                cookiesToSetOnResponse.push(...cookiesToSet)
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
            const response = NextResponse.redirect(`${origin}${next}`)
            // Propagate auth cookies to the response
            cookiesToSetOnResponse.forEach(({ name, value, options }) => {
                response.cookies.set(name, value, options)
            })
            return response
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
