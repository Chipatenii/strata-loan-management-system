'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { withServerActionThrows, createAppError, ErrorCode, normalizeSupabaseError } from '@/lib/errors'
import { z } from 'zod'

export const approveKyc = withServerActionThrows(
    async (requestId, recordId: string) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({ code: ErrorCode.AUTH_REQUIRED, message: 'Unauthorized', requestId, location: 'admin/approveKyc' })
        }

        const { error } = await supabase
            .from('kyc_records')
            .update({
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id
            })
            .eq('id', recordId)

        if (error) throw normalizeSupabaseError(error, 'admin/approveKyc', requestId)

        revalidatePath('/admin/kyc')
    },
    'admin/approveKyc'
)

export const rejectKyc = withServerActionThrows(
    async (requestId, recordId: string, reason: string) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({ code: ErrorCode.AUTH_REQUIRED, message: 'Unauthorized', requestId, location: 'admin/rejectKyc' })
        }

        const { error } = await supabase
            .from('kyc_records')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                reviewed_at: new Date().toISOString(),
                reviewed_by: user.id
            })
            .eq('id', recordId)

        if (error) throw normalizeSupabaseError(error, 'admin/rejectKyc', requestId)

        revalidatePath('/admin/kyc')
    },
    'admin/rejectKyc'
)

export const approveLoan = withServerActionThrows(
    async (requestId, loanId: string) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({ code: ErrorCode.AUTH_REQUIRED, message: 'Unauthorized', requestId, location: 'admin/approveLoan' })
        }

        const { error } = await supabase.from('loans').update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
        }).eq('id', loanId)

        if (error) throw normalizeSupabaseError(error, 'admin/approveLoan', requestId)

        revalidatePath('/admin/loans')
    },
    'admin/approveLoan'
)

export const rejectLoan = withServerActionThrows(
    async (requestId, loanId: string) => {
        const supabase = await createClient()
        const { error } = await supabase.from('loans').update({ status: 'rejected' }).eq('id', loanId)
        if (error) throw normalizeSupabaseError(error, 'admin/rejectLoan', requestId)
        revalidatePath('/admin/loans')
    },
    'admin/rejectLoan'
)

export const reconcilePayment = withServerActionThrows(
    async (requestId, paymentId: string, action: 'approve' | 'reject', reason?: string) => {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            throw createAppError({ code: ErrorCode.AUTH_REQUIRED, message: 'Unauthorized', requestId, location: 'admin/reconcilePayment' })
        }

        if (action === 'reject') {
            const { error } = await supabase.from('payments').update({
                status: 'rejected',
                rejection_reason: reason || 'No reason provided',
                reviewed_by: user.id,
                reviewed_at: new Date().toISOString()
            }).eq('id', paymentId)

            if (error) throw normalizeSupabaseError(error, 'admin/reconcilePayment/reject', requestId)

            revalidatePath('/admin/payments')
            return
        }

        // Approve Logic
        // 1. Get payment details to find loan_id and amount
        const { data: payment, error: fetchError } = await supabase
            .from('payments')
            .select('loan_id, amount, status')
            .eq('id', paymentId)
            .single()

        if (fetchError || !payment) {
            throw normalizeSupabaseError(fetchError || new Error('Payment not found'), 'admin/reconcilePayment/fetch', requestId)
        }

        if (payment.status !== 'pending') {
            throw createAppError({ code: ErrorCode.VALIDATION_FAILED, message: 'Payment already processed', requestId, location: 'admin/reconcilePayment/validation' })
        }

        // 2. Fetch latest ledger entry for this loan to get current balance
        const { data: latestLedger } = await supabase
            .from('ledger')
            .select('balance_after')
            .eq('loan_id', payment.loan_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

        const previousBalance = latestLedger?.balance_after || 0

        const newBalance = Number(previousBalance) - Number(payment.amount)

        // 3. Insert into Ledger
        const { error: ledgerError } = await supabase.from('ledger').insert({
            loan_id: payment.loan_id,
            type: 'repayment',
            amount: payment.amount,
            balance_before: previousBalance,
            balance_after: newBalance,
            description: 'Payment approved',
            reference_id: paymentId
        })

        if (ledgerError) throw normalizeSupabaseError(ledgerError, 'admin/reconcilePayment/ledger', requestId)

        // 4. Update Payment Status
        const { error: updateError } = await supabase.from('payments').update({
            status: 'approved',
            reviewed_by: user.id,
            reviewed_at: new Date().toISOString()
        }).eq('id', paymentId)

        if (updateError) throw normalizeSupabaseError(updateError, 'admin/reconcilePayment/update', requestId)

        revalidatePath('/admin/payments')
    },
    'admin/reconcilePayment'
)
