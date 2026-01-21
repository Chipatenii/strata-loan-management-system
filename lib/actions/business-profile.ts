'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

type UpdateBusinessProfileData = {
    businessId: string
    name: string
    trading_name?: string
    email?: string
    phone?: string
    physical_address?: string
    city?: string
    country?: string
    registration_number?: string
    tax_number?: string
    website_url?: string
    brand_primary_color?: string
    brand_secondary_color?: string
}

export const updateBusinessProfile = withServerAction(
    async (requestId, data: UpdateBusinessProfileData) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({
                code: ErrorCode.AUTH_REQUIRED,
                message: 'Must be logged in',
                location: 'business/updateProfile/auth',
                requestId
            })
        }

        // Verify user has permission (admin/owner role)
        const { data: membership } = await supabase
            .from('business_memberships')
            .select('role')
            .eq('user_id', user.id)
            .eq('business_id', data.businessId)
            .single()

        if (!membership || !['admin', 'owner'].includes(membership.role)) {
            throw createAppError({
                code: ErrorCode.FORBIDDEN,
                message: 'You do not have permission to update business profile',
                location: 'business/updateProfile/permission',
                requestId
            })
        }

        // Update business profile
        const { error: updateError } = await supabase
            .from('businesses')
            .update({
                name: data.name,
                trading_name: data.trading_name || null,
                email: data.email || null,
                phone: data.phone || null,
                physical_address: data.physical_address || null,
                city: data.city || null,
                country: data.country || 'Zambia',
                registration_number: data.registration_number || null,
                tax_number: data.tax_number || null,
                website_url: data.website_url || null,
                brand_primary_color: data.brand_primary_color || null,
                brand_secondary_color: data.brand_secondary_color || null
            })
            .eq('id', data.businessId)

        if (updateError) {
            throw normalizeSupabaseError(updateError, 'business/updateProfile/update', requestId)
        }

        // Create audit log
        await supabase
            .from('audit_logs')
            .insert({
                business_id: data.businessId,
                user_id: user.id,
                action: 'business_profile_updated',
                entity_type: 'business',
                entity_id: data.businessId,
                details: { updatedFields: Object.keys(data), requestId }
            })

        revalidatePath('/admin/settings')
        revalidatePath('/admin')

        return { success: true }
    },
    'business/updateProfile'
)
