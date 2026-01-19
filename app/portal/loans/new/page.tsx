import { LoanApplicationForm } from "@/components/loan-form"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function NewLoanPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Ideally check if KYC is approved
    const { data: kyc } = await supabase.from('kyc_records').select('status').eq('user_id', user.id).single()

    if (!kyc || kyc.status !== 'approved') {
        redirect('/portal/kyc')
    }

    return (
        <div className="flex justify-center py-6">
            <LoanApplicationForm userId={user.id} />
        </div>
    )
}
