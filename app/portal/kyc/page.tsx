import { KycForm } from "@/components/kyc-form"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function KycPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if already submitted
    const { data: kyc } = await supabase.from('kyc_records').select('*').eq('user_id', user.id).single()

    if (kyc && kyc.status !== 'not_submitted' && kyc.status !== 'rejected') {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
                <h1 className="text-2xl font-bold">KYC Status: {kyc.status.replace('_', ' ').toUpperCase()}</h1>
                <p className="text-muted-foreground">Your documents are under review. You will be notified once approved.</p>
            </div>
        )
    }

    return (
        <div className="flex justify-center py-6">
            <KycForm userId={user.id} />
        </div>
    )
}
