'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { paymentConfigSchema } from '@/lib/schemas'

export async function updatePaymentConfig(
    businessId: string,
    config: z.infer<typeof paymentConfigSchema>,
    instructions?: string
) {
    const supabase = await createClient()

    const { error } = await supabase.from('businesses')
        .update({
            payment_config: config,
            payment_instructions: instructions
        })
        .eq('id', businessId)

    if (error) {
        return { error: 'Failed to update payment settings: ' + error.message }
    }

    revalidatePath('/admin/settings')
    revalidatePath('/portal/payments')
    return { success: true }
}

