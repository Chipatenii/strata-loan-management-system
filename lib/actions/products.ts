'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { loanProductSchema, loanProductRateSchema } from '@/lib/schemas'

export async function createLoanProduct(formData: z.infer<typeof loanProductSchema>, businessId: string) {
    const supabase = await createClient()

    const { error } = await supabase.from('loan_products').insert({
        business_id: businessId,
        ...formData
    })

    if (error) {
        return { error: 'Failed to create product: ' + error.message }
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
