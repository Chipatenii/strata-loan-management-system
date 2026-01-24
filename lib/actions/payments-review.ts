'use server'

import { createClient } from '@/lib/supabase'
import { withServerActionThrows, createAppError, ErrorCode, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

export const reconcilePayment = withServerActionThrows(
    async (requestId, paymentId: string, action: 'approve' | 'reject', reason?: string) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({ code: ErrorCode.AUTH_REQUIRED, message: 'Unauthorized', requestId, location: 'payment/reconcilePayment' })
        }

        // Use RPC to handle reconciliation atomically (prevents race conditions)
        const { data, error } = await supabase.rpc('reconcile_payment', {
            p_payment_id: paymentId,
            p_admin_id: user.id,
            p_reject: action === 'reject',
            p_reason: reason
        })

        if (error) {
            throw normalizeSupabaseError(error, 'payment/reconcilePayment/rpc', requestId)
        }

        // Parse RPC result
        const result = data as { success: boolean, error?: string }

        if (!result.success) {
            throw createAppError({
                code: ErrorCode.VALIDATION_FAILED,
                message: result.error || 'Reconciliation failed',
                requestId,
                location: 'payment/reconcilePayment/logic'
            })
        }

        revalidatePath('/admin/payments')
    },
    'payment/reconcilePayment'
)
