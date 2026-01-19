import { expect, test, describe } from 'vitest'
import { calculateNewBalance } from './ledger'

describe('Ledger Logic', () => {
    test('Principal Disbursement increases balance', () => {
        const initial = 0
        const amount = 50000
        const newItem = calculateNewBalance(initial, amount, 'principal_disbursed')
        expect(newItem).toBe(50000)
    })

    test('Interest Accrual increases balance', () => {
        const initial = 50000
        const amount = 7500 // 15%
        const newItem = calculateNewBalance(initial, amount, 'interest_accrued')
        expect(newItem).toBe(57500)
    })

    test('Payment reduces balance', () => {
        const initial = 57500
        const amount = 5000
        const newItem = calculateNewBalance(initial, amount, 'payment_received')
        expect(newItem).toBe(52500)
    })

    test('Multiple transactions sequence', () => {
        let balance = 0
        // 1. Disburse
        balance = calculateNewBalance(balance, 10000, 'principal_disbursed')
        expect(balance).toBe(10000)

        // 2. Interest
        balance = calculateNewBalance(balance, 1500, 'interest_accrued')
        expect(balance).toBe(11500)

        // 3. Payment
        balance = calculateNewBalance(balance, 5000, 'payment_received')
        expect(balance).toBe(6500)

        // 4. Full Payment
        balance = calculateNewBalance(balance, 6500, 'payment_received')
        expect(balance).toBe(0)
    })

    test('Payment exceeding balance results in negative (overpayment)', () => {
        const initial = 1000
        const amount = 1500
        const newItem = calculateNewBalance(initial, amount, 'payment_received')
        expect(newItem).toBe(-500) // User is owed 500
    })
})
