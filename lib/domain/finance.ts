/**
 * Domain Logic: Finance & Accounting
 * Central source of truth for all financial calculations.
 */

export type RepaymentPreview = {
    principal: number
    interest: number
    total: number
}

/**
 * Calculates simple interest for a loan.
 * Formula: Interest = Principal * (MonthlyRate / 100) * DurationMonths
 */
export function calculateSimpleInterest(
    principal: number,
    monthlyRatePct: number,
    durationMonths: number
): RepaymentPreview {
    // Safety checks
    const P = Math.max(0, principal);
    const R = Math.max(0, monthlyRatePct);
    const T = Math.max(0, durationMonths);

    const interest = P * (R / 100) * T;
    const total = P + interest;

    return {
        principal: P,
        interest: Number(interest.toFixed(2)),
        total: Number(total.toFixed(2))
    };
}

/**
 * Calculates the new ledger balance after a transaction.
 * Ledger Convention:
 * - Positive Balance (+) = Debt / Money Owed by Customer
 * - Negative Balance (-) = Credit / Overpayment
 * 
 * Transactions:
 * - Disbursement (+) -> Increases Debt
 * - Interest (+) -> Increases Debt
 * - Repayment (-) -> Decreases Debt
 */
export function calculateLedgerBalance(
    currentBalance: number,
    transactionAmount: number,
    type: 'disbursement' | 'interest' | 'repayment' | 'adjustment_credit' | 'adjustment_debit'
): number {
    const balance = Number(currentBalance) || 0;
    const amount = Number(transactionAmount) || 0;

    switch (type) {
        case 'disbursement':
        case 'interest':
        case 'adjustment_debit': // Adding a fee or charge
            return Number((balance + amount).toFixed(2));

        case 'repayment':
        case 'adjustment_credit': // Waiving off or correcting
            return Number((balance - amount).toFixed(2));

        default:
            return balance;
    }
}
