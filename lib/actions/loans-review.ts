'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

type ApproveLoanData = {
    loanId: string
    businessId: string
    notes?: string
}

type RejectLoanData = {
    loanId: string
    businessId: string
    notes: string
}

export const approveLoan = withServerAction(
    async (requestId, { loanId, businessId, notes }: ApproveLoanData) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({
                code: ErrorCode.AUTH_REQUIRED,
                message: 'Must be logged in',
                location: 'loans/approveLoan/auth',
                requestId
            })
        }

        // Update loan status
        const { error: updateError } = await supabase
            .from('loans')
            .update({
                status: 'approved',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                decision_notes: notes || null
            })
            .eq('id', loanId)
            .eq('business_id', businessId)

        if (updateError) {
            throw normalizeSupabaseError(updateError, 'loans/approveLoan/update', requestId)
        }

        // Create audit log
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                business_id: businessId,
                user_id: user.id,
                action: 'loan_approved',
                entity_type: 'loan',
                entity_id: loanId,
                details: { notes, requestId }
            })

        if (auditError) {
            console.error('Failed to create audit log:', auditError)
            // Don't fail the whole operation for audit log failure
        }

        revalidatePath('/admin/loans')
        revalidatePath(`/admin/loans/${loanId}`)

        return { success: true }
    },
    'loans/approveLoan'
)

export const rejectLoan = withServerAction(
    async (requestId, { loanId, businessId, notes }: RejectLoanData) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({
                code: ErrorCode.AUTH_REQUIRED,
                message: 'Must be logged in',
                location: 'loans/rejectLoan/auth',
                requestId
            })
        }

        // Update loan status
        const { error: updateError } = await supabase
            .from('loans')
            .update({
                status: 'rejected',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString(),
                decision_notes: notes
            })
            .eq('id', loanId)
            .eq('business_id', businessId)

        if (updateError) {
            throw normalizeSupabaseError(updateError, 'loans/rejectLoan/update', requestId)
        }

        // Create audit log
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                business_id: businessId,
                user_id: user.id,
                action: 'loan_rejected',
                entity_type: 'loan',
                entity_id: loanId,
                details: { reason: notes, requestId }
            })

        if (auditError) {
            console.error('Failed to create audit log:', auditError)
        }

        revalidatePath('/admin/loans')
        revalidatePath(`/admin/loans/${loanId}`)

        return { success: true }
    },
    'loans/rejectLoan'
)
