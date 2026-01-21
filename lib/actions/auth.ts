'use server'

import { createClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { loginSchema, adminRegisterSchema, customerRegisterSchema } from '@/lib/schemas'

export const login = withServerAction(
    async (requestId, formData: z.infer<typeof loginSchema>, userType: 'admin' | 'customer' = 'customer') => {
        const supabase = await createClient()

        const { error } = await supabase.auth.signInWithPassword(formData)

        if (error) {
            throw normalizeSupabaseError(error, `auth/login/${userType}`, requestId)
        }

        // Get user and validate role matches portal
        const { data: { user } } = await supabase.auth.getUser()
        const userRole = user?.user_metadata?.role

        // Validate role matches expected portal
        if (userType === 'customer' && userRole === 'admin') {
            // Admin trying to access customer portal
            await supabase.auth.signOut()
            throw createAppError({
                code: ErrorCode.ROLE_MISMATCH,
                message: 'This is a business account. Please use the Business Portal to log in.',
                location: 'auth/login/customer',
                requestId,
                meta: { redirectTo: '/auth/admin/login' }
            })
        }

        if (userType === 'admin' && userRole !== 'admin') {
            // Customer trying to access admin portal
            await supabase.auth.signOut()
            throw createAppError({
                code: ErrorCode.ROLE_MISMATCH,
                message: 'This is a customer account. Please use the Customer Portal to log in.',
                location: 'auth/login/admin',
                requestId,
                meta: { redirectTo: '/auth/customer/login' }
            })
        }

        revalidatePath('/', 'layout')
        if (userType === 'admin') {
            redirect('/admin')
        } else {
            redirect('/portal')
        }
    },
    'auth/login'
)


export const signUpAdmin = withServerAction(
    async (requestId, formData: z.infer<typeof adminRegisterSchema>) => {
        const supabase = await createClient()
        const adminSupabase = createAdminClient()

        // 1. Sign up in Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    role: 'admin',
                    full_name: 'Admin', // Placeholder
                }
            }
        })

        if (authError || !authData.user) {
            throw normalizeSupabaseError(authError || new Error('Signup failed'), 'auth/signUpAdmin/signup', requestId)
        }

        const userId = authData.user.id

        // 2. Create Business
        // Generate simple 6-char code
        const code = 'BIZ' + Math.floor(100000 + Math.random() * 900000).toString()

        const { data: businessData, error: businessError } = await adminSupabase
            .from(' businesses')
            .insert({
                name: formData.businessName,
                code: code,
            })
            .select()
            .single()

        if (businessError) {
            throw normalizeSupabaseError(businessError, 'auth/signUpAdmin/createBusiness', requestId)
        }

        // 3. Create Public User Profile
        const { error: userError } = await adminSupabase
            .from('users')
            .insert({
                id: userId,
                email: formData.email,
                role: 'admin', // Legacy role field
                business_id: businessData.id,
                full_name: 'Admin', // Placeholder
            })

        if (userError) {
            throw normalizeSupabaseError(userError, 'auth/signUpAdmin/createUser', requestId)
        }

        // 4. Create Membership
        const { error: memberError } = await adminSupabase
            .from('business_memberships')
            .insert({
                user_id: userId,
                business_id: businessData.id,
                role: 'admin',
            })

        if (memberError) {
            throw normalizeSupabaseError(memberError, 'auth/signUpAdmin/createMembership', requestId)
        }

        revalidatePath('/', 'layout')
        redirect('/admin')
    },
    'auth/signUpAdmin'
)

export const signUpCustomer = withServerAction(
    async (requestId, formData: z.infer<typeof customerRegisterSchema>) => {
        const supabase = await createClient()
        const adminSupabase = createAdminClient()

        // 1. Validate Business Code
        const { data: businessData, error: businessError } = await adminSupabase
            .from('businesses')
            .select('id')
            .eq('code', formData.businessCode)
            .single()

        if (businessError || !businessData) {
            throw createAppError({
                code: ErrorCode.NOT_FOUND,
                message: 'Invalid Business Code.',
                location: 'auth/signUpCustomer/validateCode',
                requestId
            })
        }

        // 2. Sign up Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: formData.email,
            password: formData.password,
            options: {
                data: {
                    role: 'customer',
                    full_name: 'Customer', // Placeholder
                }
            }
        })

        if (authError || !authData.user) {
            throw normalizeSupabaseError(authError || new Error('Signup failed'), 'auth/signUpCustomer/signup', requestId)
        }

        const userId = authData.user.id

        // 3. Create Public User Profile
        const { error: userError } = await adminSupabase
            .from('users')
            .insert({
                id: userId,
                email: formData.email,
                role: 'customer',
                business_id: businessData.id,
                full_name: formData.fullName,
                phone: formData.phone,
                address: formData.address,
            })

        if (userError) {
            throw normalizeSupabaseError(userError, 'auth/signUpCustomer/createUser', requestId)
        }

        revalidatePath('/', 'layout')
        redirect('/portal?welcome=true')
    },
    'auth/signUpCustomer'
)

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/customer/login') // Default redirect
}
