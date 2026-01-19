'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { z } from 'zod'

import { loginSchema, registerSchema } from '@/lib/schemas'

export async function login(formData: z.infer<typeof loginSchema>) {
    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword(formData)

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/portal')
}

export async function signup(formData: z.infer<typeof registerSchema>) {
    const supabase = await createClient()

    // 1. Verify Invite Code (Pilot Mode)
    // In a real app, this might check a DB table of codes.
    // For MVP, checking against an ENV var or hardcoded list.
    const validCodes = (process.env.PILOT_INVITE_CODES || 'STRATA2025,PILOT2025').split(',')

    if (!validCodes.includes(formData.inviteCode)) {
        return { error: 'Invalid invite code.' }
    }

    // 2. Sign up
    const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        // Note: We can add metadata like full_name here if we collected it, 
        // but the users table trigger or subsequent profile update handles it.
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')
    redirect('/portal?welcome=true')
}

export async function signout() {
    const supabase = await createClient()
    await supabase.auth.signOut()
    revalidatePath('/', 'layout')
    redirect('/login')
}
