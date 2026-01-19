'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function approveKyc(recordId: string) {
    const supabase = createClient()

    // Verify Admin (Optional double check, RLS handles it mostly but good for actions)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Update KYC
    const { error } = await supabase
        .from('kyc_records')
        .update({
            status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
        })
        .eq('id', recordId)

    if (error) return { error: error.message }

    revalidatePath('/admin/kyc')
    return { success: true }
}

export async function rejectKyc(recordId: string, reason: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { error } = await supabase
        .from('kyc_records')
        .update({
            status: 'rejected',
            rejection_reason: reason,
            reviewed_at: new Date().toISOString(),
            reviewed_by: user.id
        })
        .eq('id', recordId)

    if (error) return { error: error.message }

    revalidatePath('/admin/kyc')
    return { success: true }
}

export async function approveLoan(loanId: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Update Loan to 'active'
    const { error } = await supabase
        .from('loans')
        .update({
            status: 'active',
            approved_at: new Date().toISOString(),
            approved_by: user.id,
            disbursed_at: new Date().toISOString(), // Simulating instant disbursement for pilot
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // +30 days (default)
            // Note: Real duration logic should be applied here.
        })
        .eq('id', loanId)

    if (error) return { error: error.message }

    // 2. Create Ledger Entry (Principal Disbursed)
    // We need to fetch the loan amount first.
    const { data: loan } = await supabase.from('loans').select('amount').eq('id', loanId).single()

    if (loan) {
        await supabase.from('ledger').insert({
            loan_id: loanId,
            type: 'principal_disbursed',
            amount: loan.amount, // Positive = Owed by customer
            balance_after: loan.amount, // Initial balance
            description: 'Principal Disbursement',
        })
    }

    revalidatePath('/admin/loans')
    return { success: true }
}

export async function rejectLoan(loanId: string) {
    const supabase = createClient()
    const { error } = await supabase.from('loans').update({ status: 'rejected' }).eq('id', loanId)
    if (error) return { error: error.message }
    revalidatePath('/admin/loans')
    return { success: true }
}

export async function reconcilePayment(paymentId: string, action: 'approve' | 'reject') {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (action === 'reject') {
        await supabase.from('payments').update({ status: 'rejected', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', paymentId)
        revalidatePath('/admin/payments')
        return { success: true }
    }

    // Approve
    // 1. Get Payment & Loan Details
    const { data: payment } = await supabase.from('payments').select('*').eq('id', paymentId).single()
    if (!payment) return { error: 'Payment not found' }

    // 2. Get Current Balance from latest ledger entry
    const { data: latestLedger } = await supabase
        .from('ledger')
        .select('balance_after')
        .eq('loan_id', payment.loan_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    const currentBalance = latestLedger ? latestLedger.balance_after : 0
    const newBalance = currentBalance - payment.amount // Balance reduces

    // 3. Insert Ledger Entry
    const { error: ledgerError } = await supabase.from('ledger').insert({
        loan_id: payment.loan_id,
        type: 'payment_received',
        amount: -payment.amount, // Negative for credit
        balance_after: newBalance,
        description: `Payment via ${payment.method} (${payment.provider})`,
        reference_id: payment.id
    })

    if (ledgerError) return { error: ledgerError.message }

    // 4. Update Payment Status
    await supabase.from('payments').update({ status: 'approved', reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', paymentId)

    revalidatePath('/admin/payments')
    return { success: true }
}
