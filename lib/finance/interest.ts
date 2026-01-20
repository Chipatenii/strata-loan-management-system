export type RepaymentPreview = {
    principal: number
    interest: number
    total: number
}

/**
 * Calculates simple interest.
 * Formula: Total = Principal + (Principal * (Rate/100) * Duration)
 * Note: Duration unit assumption depends on rate period. Usually Monthly Rate * Months.
 */
export function calculateSimpleInterest(
    principal: number,
    monthlyRatePct: number,
    durationMonths: number
): RepaymentPreview {
    if (principal < 0 || monthlyRatePct < 0 || durationMonths < 0) {
        return { principal: 0, interest: 0, total: 0 }
    }

    const interest = principal * (monthlyRatePct / 100) * durationMonths
    const total = principal + interest

    return {
        principal,
        interest: Number(interest.toFixed(2)),
        total: Number(total.toFixed(2))
    }
}
