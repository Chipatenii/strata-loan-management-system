'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loanProductSchema, loanProductRateSchema } from '@/lib/schemas'
import { requireAdminMembership } from '@/lib/errors'

export async function createLoanProduct(
    formData: z.infer<typeof loanProductSchema>,
    businessId: string,
    initialRates?: Omit<z.infer<typeof loanProductRateSchema>, 'product_id'>[]
) {
    const supabase = await createClient()

    // Verify admin membership
    await requireAdminMembership(supabase, businessId, 'n/a', 'products/createLoanProduct')

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
            return { error: 'Product created but failed to save rates: ' + ratesError.message }
        }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function updateLoanProduct(id: string, formData: Partial<z.infer<typeof loanProductSchema>>) {
    const supabase = await createClient()

    // Fetch the product to get its business_id
    const { data: product } = await supabase.from('loan_products').select('business_id').eq('id', id).single()
    if (!product) return { error: 'Product not found' }

    await requireAdminMembership(supabase, product.business_id, 'n/a', 'products/updateLoanProduct')

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

    // Fetch the product to get its business_id
    const { data: product } = await supabase.from('loan_products').select('business_id').eq('id', formData.product_id).single()
    if (!product) return { error: 'Product not found' }

    await requireAdminMembership(supabase, product.business_id, 'n/a', 'products/createProductRate')

    const { error } = await supabase.from('loan_product_rates').insert(formData)

    if (error) {
        return { error: 'Failed to add rate: ' + error.message }
    }

    revalidatePath('/admin/products')
    return { success: true }
}

export async function deleteProductRate(id: string) {
    const supabase = await createClient()

    // Fetch the rate -> product -> business_id
    const { data: rate } = await supabase
        .from('loan_product_rates')
        .select('product_id, loan_products(business_id)')
        .eq('id', id)
        .single()

    if (!rate) return { error: 'Rate not found' }

    const businessId = (rate.loan_products as any)?.business_id
    if (!businessId) return { error: 'Product not found' }

    await requireAdminMembership(supabase, businessId, 'n/a', 'products/deleteProductRate')

    const { error } = await supabase.from('loan_product_rates').delete().eq('id', id)

    if (error) {
        return { error: 'Failed to delete rate' }
    }

    revalidatePath('/admin/products')
    return { success: true }
}
