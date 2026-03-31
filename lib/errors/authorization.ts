import { createAppError } from './helpers'
import { ErrorCode } from './codes'

/**
 * Verifies the current user is an admin/owner of the specified business.
 * Returns the user object if authorized, throws AppError if not.
 */
export async function requireAdminMembership(
    supabase: any,
    businessId: string,
    requestId: string,
    location: string
): Promise<{ id: string; email?: string }> {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw createAppError({
            code: ErrorCode.AUTH_REQUIRED,
            message: 'Must be logged in',
            location: `${location}/auth`,
            requestId
        })
    }

    const { data: membership } = await supabase
        .from('business_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', businessId)
        .single()

    if (!membership || !['admin', 'owner'].includes(membership.role)) {
        throw createAppError({
            code: ErrorCode.FORBIDDEN,
            message: 'You do not have permission to perform this action',
            location: `${location}/permission`,
            requestId
        })
    }

    return user
}
