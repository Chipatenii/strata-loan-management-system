import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { updatePaymentConfig } from "@/lib/actions/business"
import { PaymentSettingsForm } from "./form"

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business Payment Config
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('id, payment_config').eq('id', profile?.business_id).single()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Settings</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Payment Instructions</CardTitle>
                    <CardDescription>
                        Configure how customers should pay you. These instructions will be shown when they make a payment.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaymentSettingsForm businessId={business?.id} initialConfig={business?.payment_config || {}} />
                </CardContent>
            </Card>
        </div>
    )
}
