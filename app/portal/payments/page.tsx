import { PaymentForm } from "@/components/payment-form"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function NewPaymentPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/login')

    // Fetch active loans
    const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'defaulted']) // Only pay allowed statuses

    return (
        <div className="flex justify-center py-6">
            <PaymentForm userId={user.id} loans={loans || []} />
        </div>
    )
}
