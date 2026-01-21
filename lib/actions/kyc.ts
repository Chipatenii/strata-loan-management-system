'use server'

import { createClient } from '@/lib/supabase'
import { withServerAction, ErrorCode, createAppError, normalizeSupabaseError } from '@/lib/errors'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

/**
 * Uploads a file to Supabase storage
 */
async function uploadFile(
    bucket: string,
    file: { name: string; type: string; base64: string },
    path: string,
    requestId: string
): Promise<string> {
    const supabase = await createClient()

    // Convert base64 to buffer
    const buffer = Buffer.from(file.base64, 'base64')

    const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, buffer, {
            contentType: file.type,
            upsert: true
        })

    if (error) {
        throw createAppError({
            code: ErrorCode.STORAGE_UPLOAD_FAILED,
            message: `Failed to upload ${file.name}`,
            location: `kyc/uploadFile/${bucket}`,
            requestId,
            cause: error
        })
    }

    return data.path
}

type KycFormData = {
    userId: string
    businessId: string

    // Personal
    dob: string
    nrc_passport_number: string
    gender: string
    marital_status: string
    residential_address: string
    city_town: string

    // Employment
    employment_status: string
    employer_name?: string
    job_title?: string
    monthly_income?: string
    pay_day?: string

    // Banking
    bank_name?: string
    account_number?: string

    // Next of Kin
    nok_full_name: string
    nok_relationship: string
    nok_phone: string
    nok_address: string

    // Files (base64 encoded)
    idFile: { name: string; type: string; base64: string }
    payslipFile: { name: string; type: string; base64: string }
    bankStatementFile: { name: string; type: string; base64: string }
    proofFile: { name: string; type: string; base64: string }
}

export const submitKyc = withServerAction(
    async (requestId, formData: KycFormData) => {
        const supabase = await createClient()
        const timestamp = Date.now()

        // Upload all files
        const idPath = await uploadFile(
            'kyc-docs',
            formData.idFile,
            `${formData.userId}/id_${timestamp}_${formData.idFile.name}`,
            requestId
        )

        const payslipPath = await uploadFile(
            'kyc-docs',
            formData.payslipFile,
            `${formData.userId}/payslip_${timestamp}_${formData.payslipFile.name}`,
            requestId
        )

        const bankPath = await uploadFile(
            'kyc-docs',
            formData.bankStatementFile,
            `${formData.userId}/bank_${timestamp}_${formData.bankStatementFile.name}`,
            requestId
        )

        const proofPath = await uploadFile(
            'kyc-docs',
            formData.proofFile,
            `${formData.userId}/proof_${timestamp}_${formData.proofFile.name}`,
            requestId
        )

        // Insert KYC record
        const { error } = await supabase.from('kyc_records').insert({
            user_id: formData.userId,
            business_id: formData.businessId,
            status: 'pending_review',

            // Documents
            id_document_url: idPath,
            payslip_url: payslipPath,
            bank_statement_url: bankPath,
            proof_of_address_url: proofPath,

            // Structured Data
            dob: formData.dob || null,
            nrc_passport_number: formData.nrc_passport_number,
            gender: formData.gender,
            marital_status: formData.marital_status,
            residential_address: formData.residential_address,
            city_town: formData.city_town,

            employment_status: formData.employment_status,
            employer_name: formData.employer_name,
            job_title: formData.job_title,
            monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
            pay_day: formData.pay_day,

            bank_name: formData.bank_name,
            account_number: formData.account_number,

            nok_full_name: formData.nok_full_name,
            nok_relationship: formData.nok_relationship,
            nok_phone: formData.nok_phone,
            nok_address: formData.nok_address,

            data: { uploaded_at: new Date().toISOString(), requestId }
        })

        if (error) {
            throw normalizeSupabaseError(error, 'kyc/submitKyc/insert', requestId)
        }

        revalidatePath('/portal')
        redirect('/portal')
    },
    'kyc/submitKyc'
)
