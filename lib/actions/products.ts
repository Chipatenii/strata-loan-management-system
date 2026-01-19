'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loanProductSchema, loanProductRateSchema } from '@/lib/schemas'

export async function createLoanProduct(
    formData: z.infer<typeof loanProductSchema>,
    businessId: string,
    initialRates?: Omit<z.infer<typeof loanProductRateSchema>, 'product_id'>[]
) {
    const supabase = await createClient()

    const { data, error } = await supabase.from('loan_products').insert({
        business_id: businessId,
        ...formData
    }).select().single()

    if (error) {
        return { error: 'Failed to create product: ' + error.message }
    }

    // If there are initial rates, insert them
    if (initialRates && initialRates.length > 0) {
        const ratesToInsert = initialRates.map(rate => ({
            product_id: data.id,
            duration_unit: rate.duration_unit,
            duration_value: rate.duration_value,
            interest_rate: rate.interest_rate
        }))

        const { error: ratesError } = await supabase.from('loan_product_rates').insert(ratesToInsert)

        if (ratesError) {
            // Optional: Should we rollback product creation? Supabase doesn't have easy multi-table transactions via JS client 
            // without RPC. For now, we'll return a warning or error but the product exists.
            // A better way would be an RPC function, but keeping it simple as per "Do not rebuild".
            return { error: 'Product created but failed to save rates: ' + ratesError.message }
        }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function updateLoanProduct(id: string, formData: Partial<z.infer<typeof loanProductSchema>>) {
    const supabase = await createClient()

    const { error } = await supabase.from('loan_products')
        .update(formData)
        .eq('id', id)

    if (error) {
        return { error: 'Failed to update product: ' + error.message }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function createProductRate(formData: z.infer<typeof loanProductRateSchema>) {
    const supabase = await createClient()

    const { error } = await supabase.from('loan_product_rates').insert(formData)

    if (error) {
        return { error: 'Failed to add rate: ' + error.message }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function deleteProductRate(id: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('loan_product_rates').delete().eq('id', id)

    if (error) {
        return { error: 'Failed to delete rate' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}
