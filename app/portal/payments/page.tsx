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

    // Get Business Config
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('payment_config').eq('id', profile?.business_id).single()

    const paymentConfig = business?.payment_config || {}

    return (
        <div className="flex justify-center py-6">
            <PaymentForm
                userId={user.id}
                businessId={profile?.business_id}
                loans={loans || []}
                paymentConfig={paymentConfig}
            />
        </div>
    )
}
