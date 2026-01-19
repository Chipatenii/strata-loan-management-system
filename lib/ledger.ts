export type LedgerEntryType = 'principal_disbursed' | 'interest_accrued' | 'payment_received' | 'fee' | 'adjustment' | 'penalty';

/**
 * Calculates the new loan balance based on a transaction.
 * 
 * POSITIVE BALANCE = User Owes Money (Debt)
 * 
 * @param currentBalance - The current outstanding balance (e.g., 50000)
 * @param amount - The transaction amount (positive magnitude, e.g., 5000)
 * @param type - The type of transaction
 * @returns The new balance after applying the transaction
 */
export function calculateNewBalance(currentBalance: number, amount: number, type: LedgerEntryType): number {
    const magnitude = Math.abs(amount);

    switch (type) {
        case 'principal_disbursed':
            // Increases what they owe
            return currentBalance + magnitude;

        case 'interest_accrued':
            // Increases what they owe
            return currentBalance + magnitude;

        case 'fee':
        case 'penalty':
            // Increases what they owe
            return currentBalance + magnitude;

        case 'payment_received':
            // Decreases what they owe
            return currentBalance - magnitude;

        case 'adjustment':
            // Ambiguous without sign, but typically adjustments fix errors. 
            // If we treat input as signed, strictly add. 
            // But here we take magnitude. Let's assume adjustment reduces debt (credit) 
            // OR strictly follows the input sign if we changed signature.
            // For MVP safety: Let's assume adjustment is a reduction (credit) unless specified otherwise.
            // Actually, best to just return current - magnitude.
            return currentBalance - magnitude;

        default:
            return currentBalance;
    }
}
