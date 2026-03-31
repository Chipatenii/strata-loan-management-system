'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, normalizeSupabaseError, requireAdminMembership, ErrorCode, createAppError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'

type ApproveKycData = {
    recordId: string
    businessId: string
}

type RejectKycData = {
    recordId: string
    businessId: string
    reason: string
}

export const approveKyc = withServerAction(
    async (requestId, { recordId, businessId }: ApproveKycData) => {
        const supabase = await createClient()

        if (!businessId) {
            throw createAppError({
                code: ErrorCode.VALIDATION_FAILED,
                message: 'Business ID is required',
                location: 'kyc/approveKyc/validation',
                requestId
            })
        }

        const user = await requireAdminMembership(supabase, businessId, requestId, 'kyc/approveKyc')

        // Update KYC status
        const { error: updateError } = await supabase
            .from('kyc_records')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id
            })
            .eq('id', recordId)

        if (updateError) {
            throw normalizeSupabaseError(updateError, 'kyc/approveKyc/update', requestId)
        }

        // Create Audit Log
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                business_id: businessId,
                user_id: user.id,
                action: 'kyc_approved',
                entity_type: 'kyc_record',
                entity_id: recordId,
                details: { requestId }
            })

        if (auditError) console.error('Failed to audit KYC approval:', auditError)

        revalidatePath('/admin/kyc')
        revalidatePath('/portal')
        revalidatePath('/portal/kyc')
        return { data: { success: true } }
    },
    'kyc/approveKyc'
)

export const rejectKyc = withServerAction(
    async (requestId, { recordId, businessId, reason }: RejectKycData) => {
        const supabase = await createClient()

        if (!businessId) {
            throw createAppError({
                code: ErrorCode.VALIDATION_FAILED,
                message: 'Business ID is required',
                location: 'kyc/rejectKyc/validation',
                requestId
            })
        }

        const user = await requireAdminMembership(supabase, businessId, requestId, 'kyc/rejectKyc')

        // Update KYC status
        const { error: updateError } = await supabase
            .from('kyc_records')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id
            })
            .eq('id', recordId)

        if (updateError) {
            throw normalizeSupabaseError(updateError, 'kyc/rejectKyc/update', requestId)
        }

        // Create Audit Log
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                business_id: businessId,
                user_id: user.id,
                action: 'kyc_rejected',
                entity_type: 'kyc_record',
                entity_id: recordId,
                details: { reason, requestId }
            })

        if (auditError) console.error('Failed to audit KYC rejection:', auditError)

        revalidatePath('/admin/kyc')
        revalidatePath('/portal')
        revalidatePath('/portal/kyc')
        return { data: { success: true } }
    },
    'kyc/rejectKyc'
)
