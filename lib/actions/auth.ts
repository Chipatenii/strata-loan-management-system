'use server'

import { createClient } from '@/lib/supabase'
import { createAdminClient } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { loginSchema, adminRegisterSchema, customerRegisterSchema } from '@/lib/schemas'

export async function login(formData: z.infer<typeof loginSchema>, userType: 'admin' | 'customer' = 'customer') {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword(formData)

    if (error) {
        return { error: error.message }
    }

    // Get user and validate role matches portal
    const { data: { user } } = await supabase.auth.getUser()
    const userRole = user?.user_metadata?.role

    // Validate role matches expected portal
    if (userType === 'customer' && userRole === 'admin') {
        // Admin trying to access customer portal
        await supabase.auth.signOut() // Sign them out immediately
        return {
            error: 'This is a business account. Please use the Business Portal to log in.',
            redirectTo: '/auth/admin/login'
        }
    }

    if (userType === 'admin' && userRole !== 'admin') {
        // Customer trying to access admin portal
        await supabase.auth.signOut() // Sign them out immediately
        return {
            error: 'This is a customer account. Please use the Customer Portal to log in.',
            redirectTo: '/auth/customer/login'
        }
    }

    revalidatePath('/', 'layout')
    if (userType === 'admin') {
        redirect('/admin')
    } else {
        redirect('/portal')
    }
}

export async function signUpAdmin(formData: z.infer<typeof adminRegisterSchema>) {
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
        return { error: authError?.message || 'Signup failed' }
    }

    const userId = authData.user.id

    // 2. Create Business
    // Generate simple 6-char code
    const code = 'BIZ' + Math.floor(100000 + Math.random() * 900000).toString()

    const { data: businessData, error: businessError } = await adminSupabase
        .from('businesses')
        .insert({
            name: formData.businessName,
            code: code,
        })
        .select()
        .single()

    if (businessError) {
        // Cleanup auth user? ideally yes, but for MVP just fail.
        return { error: 'Failed to create business: ' + businessError.message }
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
        return { error: 'Failed to create user profile: ' + userError.message }
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
        return { error: 'Failed to create membership: ' + memberError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/admin')
}

export async function signUpCustomer(formData: z.infer<typeof customerRegisterSchema>) {
    const supabase = await createClient()
    const adminSupabase = createAdminClient()

    // 1. Validate Business Code
    const { data: businessData, error: businessError } = await adminSupabase
        .from('businesses')
        .select('id')
        .eq('code', formData.businessCode)
        .single()

    if (businessError || !businessData) {
        return { error: 'Invalid Business Code.' }
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
        return { error: authError?.message || 'Signup failed' }
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
        return { error: 'Failed to create user profile: ' + userError.message }
    }

    revalidatePath('/', 'layout')
    redirect('/portal?welcome=true')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/auth/customer/login') // Default redirect
}
