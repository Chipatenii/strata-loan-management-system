import { LoanApplicationStepper } from "@/components/loan-application-stepper"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function NewLoanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Get Business ID
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    if (!profile?.business_id) redirect('/login') // Should not happen if data integrity is good

    // Fetch Active Products & Rates for this Business
    const { data: products } = await supabase
        .from('loan_products')
        .select(`
            *,
            loan_product_rates (*)
        `)
        .eq('business_id', profile.business_id)
        .eq('is_active', true)

    // Check KYC Status
    const { data: kyc } = await supabase.from('kyc_records').select('status').eq('user_id', user.id).single()
    const kycStatus = kyc?.status || 'not_submitted'

    return (
        <div className="flex justify-center py-6">
            <LoanApplicationStepper
                userId={user.id}
                businessId={profile.business_id}
                products={products || []}
                kycStatus={kycStatus}
            />
        </div>
    )
}
