'use server'

import { createClient } from "@/lib/supabase"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { getAppOrigin } from "@/lib/config/app"

// Schemas for validation
const forgotPasswordSchema = z.object({
    email: z.string().email("Invalid email address"),
})

const updatePasswordSchema = z.object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Password must be at least 6 characters"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
})

export async function forgotPassword(
    formData: z.infer<typeof forgotPasswordSchema>,
    userType: 'admin' | 'customer'
) {
    const supabase = await createClient()

    // Use centralized app origin
    const baseUrl = getAppOrigin()

    // Construct the Redirect URL
    // When the user clicks the email link, they go to:
    // .../auth/callback?code=...&next=/auth/{userType}/reset-password
    const redirectPath = `/auth/${userType}/reset-password`
    const redirectTo = `${baseUrl}/auth/callback?next=${redirectPath}`

    const { error } = await supabase.auth.resetPasswordForEmail(formData.email, {
        redirectTo,
    })

    if (error) {
        console.error("Reset Password Error:", error.message)
        // For security, don't reveal if email exists or not usually, 
        // but Supabase might return error if rate limited etc.
        // We will return generic success or specific error if critical.
        // However, user might fetch error to show specific toast.
        return { error: error.message }
    }

    return { success: true }
}

export async function updatePassword(
    formData: z.infer<typeof updatePasswordSchema>,
    userType: 'admin' | 'customer'
) {
    const supabase = await createClient()

    const { error } = await supabase.auth.updateUser({
        password: formData.password
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/', 'layout')

    // Redirect to appropriate portal home
    if (userType === 'admin') {
        redirect('/admin')
    } else {
        redirect('/portal')
    }
}
