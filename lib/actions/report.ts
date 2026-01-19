'use server'

import { createClient } from "@/lib/supabase"
import { addDays, endOfDay, format, startOfDay, subDays } from "date-fns"

export type ReportMetrics = {
    period: {
        loans_issued: number
        amount_disbursed: number
        interest_expected: number
        payments_collected: number
    }
    portfolio: {
        total_active_loans: number
        total_outstanding: number
        total_bad_loans: number // Overdue ??? (We don't have explicit due date tracking easily yet, will approximate)
        bad_loan_ratio: number
    }
    chart_data: {
        date: string
        disbursed: number
        collected: number
    }[]
}

export async function getBusinessReports(
    businessId: string,
    dateRange: { from: Date; to: Date }
): Promise<{ data?: ReportMetrics; error?: string }> {
    const supabase = await createClient()

    try {
        const fromISO = startOfDay(dateRange.from).toISOString()
        const toISO = endOfDay(dateRange.to).toISOString()

        // 1. Fetch Loans created in Period
        const { data: newLoans, error: loanError } = await supabase
            .from('loans')
            .select('amount, applied_rate, duration_months, created_at')
            .eq('business_id', businessId)
            .gte('created_at', fromISO)
            .lte('created_at', toISO)

        if (loanError) throw loanError

        // 2. Fetch Payments collected in Period
        const { data: payments, error: payError } = await supabase
            .from('payments')
            .select('amount, created_at')
            .eq('business_id', businessId)
            .eq('status', 'approved') // Only approved payments
            .gte('created_at', fromISO)
            .lte('created_at', toISO)

        if (payError) throw payError

        // 3. Fetch Portfolio State (All Active Loans)
        const { data: activeLoans, error: activeError } = await supabase
            .from('loans')
            .select('id, amount, applied_rate, duration_months, created_at, status, payments(amount, status)')
            .eq('business_id', businessId)
            .neq('status', 'rejected')
            .neq('status', 'completed') // Assuming 'completed' means fully paid. 'active' and 'pending' ???

        if (activeError) throw activeError

        // --- CALCULATION LOGIC ---

        // Period Metrics
        const loans_issued = newLoans.length
        const amount_disbursed = newLoans.reduce((sum, l) => sum + Number(l.amount), 0)

        // Expected Interest for New Loans (Principal * Rate * Duration)
        // Rate is % per month. Duration is months.
        const interest_expected = newLoans.reduce((sum, l) => {
            const principal = Number(l.amount)
            const rate = Number(l.applied_rate) / 100
            const duration = l.duration_months
            // Simple interest per month
            return sum + (principal * rate * duration)
        }, 0)

        const payments_collected = payments.reduce((sum, p) => sum + Number(p.amount), 0)

        // Portfolio Metrics
        let total_active_loans = 0
        let total_outstanding = 0
        let total_bad_loans = 0

        const now = new Date()

        activeLoans.forEach(loan => {
            if (loan.status === 'active' || loan.status === 'defaulted') {
                total_active_loans++

                const principal = Number(loan.amount)
                const rate = Number(loan.applied_rate) / 100
                const duration = loan.duration_months
                const totalDue = principal * (1 + (rate * duration))

                // Sum verified payments for this loan
                // Note: supabase join returns array of payments
                const paid = (loan.payments as any[])
                    ?.filter((p: any) => p.status === 'verified')
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0) || 0

                const outstanding = Math.max(0, totalDue - paid)
                total_outstanding += outstanding

                // Bad Loan Logic: Created At + Duration Months < Now ??
                // Or simplified: if status is 'defaulted' (if we had that).
                // Let's infer bad loan: If (Now > Created + Duration) AND Outstanding > 0
                const createdAt = new Date(loan.created_at)
                // Add months
                const dueDate = addDays(createdAt, duration * 30) // Approx

                if (now > dueDate && outstanding > 10) { // Tolerance
                    total_bad_loans++
                }
            }
        })

        const bad_loan_ratio = total_active_loans > 0 ? (total_bad_loans / total_active_loans) * 100 : 0

        // Chart Data (Group by Day)
        // Map Over Date Range
        const chart_data: any[] = []
        let curr = startOfDay(dateRange.from)
        while (curr <= dateRange.to) {
            const dateStr = format(curr, 'yyyy-MM-dd')

            const dayDisbursed = newLoans
                .filter(l => format(new Date(l.created_at), 'yyyy-MM-dd') === dateStr)
                .reduce((s, l) => s + Number(l.amount), 0)

            const dayCollected = payments
                .filter(p => format(new Date(p.created_at), 'yyyy-MM-dd') === dateStr)
                .reduce((s, p) => s + Number(p.amount), 0)

            chart_data.push({
                date: format(curr, 'MMM dd'),
                disbursed: dayDisbursed,
                collected: dayCollected
            })

            curr = addDays(curr, 1)
        }

        return {
            data: {
                period: {
                    loans_issued,
                    amount_disbursed,
                    interest_expected,
                    payments_collected
                },
                portfolio: {
                    total_active_loans,
                    total_outstanding,
                    total_bad_loans,
                    bad_loan_ratio
                },
                chart_data
            }
        }

    } catch (e: any) {
        return { error: e.message }
    }
}
