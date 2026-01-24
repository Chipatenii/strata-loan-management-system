import { KycForm } from "@/components/kyc-form"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function KycPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Check if already submitted
    const { data: kyc } = await supabase.from('kyc_records').select('*').eq('user_id', user.id).single()

    // Get Business ID
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

    if (kyc && kyc.status !== 'not_submitted' && kyc.status !== 'rejected') {
        const isApproved = kyc.status === 'approved'

        return (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-6 max-w-md mx-auto">
                <div className={`p-4 rounded-full ${isApproved ? 'bg-green-100' : 'bg-amber-100'}`}>
                    {isApproved ? (
                        <div className="text-green-600 font-bold text-4xl">✓</div>
                    ) : (
                        <div className="text-amber-600 font-bold text-4xl">⋯</div>
                    )}
                </div>
                <div className="space-y-2">
                    <h1 className="text-2xl font-bold">KYC Status: {kyc.status.replace('_', ' ').toUpperCase()}</h1>
                    <p className="text-muted-foreground">
                        {isApproved
                            ? "Congratulations! Your profile has been verified. You are now eligible to apply for loans."
                            : "Your documents are currently under review by our team. We'll notify you once the process is complete."}
                    </p>
                </div>
                {isApproved && (
                    <Link href="/portal/loans/new">
                        <Button className="w-full">Apply for a Loan</Button>
                    </Link>
                )}
            </div>
        )
    }

    return (
        <div className="flex justify-center py-6">
            <KycForm userId={user.id} businessId={profile?.business_id} />
        </div>
    )
}
