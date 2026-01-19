'use server'

import { createClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { paymentConfigSchema } from '@/lib/schemas'

export async function updatePaymentConfig(businessId: string, config: z.infer<typeof paymentConfigSchema>) {
    const supabase = await createClient()

    // We verify membership via RLS, but double check we are updating correct biz
    const { error } = await supabase.from('businesses')
        .update({ payment_config: config })
        .eq('id', businessId)

    if (error) {
        return { error: 'Failed to update payment settings: ' + error.message }
    }

    revalidatePath('/admin/settings')
    return { success: true }
}
