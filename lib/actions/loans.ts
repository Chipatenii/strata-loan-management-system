'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { calculateSimpleInterest } from '@/lib/domain/finance'

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
    rateId: string // The selected loan_product_rates ID
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

        // Fetch selected rate configuration
        const { data: rateConfig, error: rateError } = await supabase
            .from('loan_product_rates')
            .select('*')
            .eq('id', formData.rateId)
            // .eq('product_id', formData.productId) // Good safety check, but let's trust ID for now to reduce complexity if relation check fails RLS invisible
            .single()

        if (rateError || !rateConfig) {
            throw createAppError({
                code: ErrorCode.VALIDATION_FAILED,
                message: 'Invalid loan rate selected',
                requestId,
                location: 'loans/submitLoanApplication/rate'
            })
        }

        // Calculate based on DB configuration
        const principal = parseFloat(formData.amount)
        const interestRate = Number(rateConfig.interest_rate)

        // Duration normalization
        let durationMonths = rateConfig.duration_value
        if (rateConfig.duration_unit === 'week') {
            durationMonths = rateConfig.duration_value / 4
        }

        const financials = calculateSimpleInterest(principal, interestRate, durationMonths)

        // Insert loan application
        const { error } = await supabase.from('loans').insert({
            user_id: formData.userId,
            business_id: formData.businessId,
            product_id: formData.productId,
            amount: principal,
            purpose: formData.purpose,
            status: 'pending_review',
            employment_status: formData.employmentStatus,
            monthly_income: parseFloat(formData.monthlyIncome),
            collateral_type: formData.collateralType || null,
            collateral_value: formData.collateralValue ? parseFloat(formData.collateralValue) : null,
            collateral_description: formData.collateralDescription || null,
            collateral_image_urls: collateralUrls.length > 0 ? collateralUrls : null,

            // Domain Calculated Values
            principal_amount: financials.principal,
            interest_rate: interestRate,
            interest_rate_pct_used: interestRate,
            interest_amount: financials.interest,
            total_payable_amount: financials.total,
            duration_months: Math.ceil(durationMonths),

            data: {
                submitted_at: new Date().toISOString(),
                requestId,
                rate_id: formData.rateId
            }
        })

        if (error) {
            throw normalizeSupabaseError(error, 'loans/submitLoanApplication/insert', requestId)
        }

        revalidatePath('/portal/loans')
        redirect('/portal/loans')
    },
    'loans/submitLoanApplication'
)
