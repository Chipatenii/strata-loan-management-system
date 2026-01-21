'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Upload collateral image to storage
 */
async function uploadCollateral(
    file: { name: string; type: string; base64: string },
    userId: string,
    requestId: string
): Promise<string> {
    const supabase = await createClient()
    const timestamp = Date.now()
    const buffer = Buffer.from(file.base64, 'base64')

    const path = `${userId}/collateral_${timestamp}_${file.name}`
    const { data, error } = await supabase.storage
        .from('collateral')
        .upload(path, buffer, {
            contentType: file.type,
            upsert: true
        })

    if (error) {
        throw createAppError({
            code: ErrorCode.STORAGE_UPLOAD_FAILED,
            message: `Failed to upload collateral image`,
            location: 'loans/uploadCollateral',
            requestId,
            cause: error
        })
    }

    return data.path
}

type LoanApplicationData = {
    userId: string
    businessId: string
    productId: string
    amount: string
    purpose: string
    employmentStatus: string
    monthlyIncome: string
    collateralType?: string
    collateralValue?: string
    collateralDescription?: string
    collateralImages?: Array<{ name: string; type: string; base64: string }>
}

export const submitLoanApplication = withServerAction(
    async (requestId, formData: LoanApplicationData) => {
        const supabase = await createClient()

        // Upload collateral images if provided
        let collateralUrls: string[] = []
        if (formData.collateralImages && formData.collateralImages.length > 0) {
            collateralUrls = await Promise.all(
                formData.collateralImages.map(img =>
                    uploadCollateral(img, formData.userId, requestId)
                )
            )
        }

        // Insert loan application
        const { error } = await supabase.from('loans').insert({
            user_id: formData.userId,
            business_id: formData.businessId,
            product_id: formData.productId,
            amount: parseFloat(formData.amount),
            purpose: formData.purpose,
            status: 'pending_review',
            employment_status: formData.employmentStatus,
            monthly_income: parseFloat(formData.monthlyIncome),
            collateral_type: formData.collateralType || null,
            collateral_value: formData.collateralValue ? parseFloat(formData.collateralValue) : null,
            collateral_description: formData.collateralDescription || null,
            collateral_image_urls: collateralUrls.length > 0 ? collateralUrls : null,
            data: { submitted_at: new Date().toISOString(), requestId }
        })

        if (error) {
            throw normalizeSupabaseError(error, 'loans/submitLoanApplication/insert', requestId)
        }

        revalidatePath('/portal/loans')
        redirect('/portal/loans')
    },
    'loans/submitLoanApplication'
)
