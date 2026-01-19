import { createClient } from "@/lib/supabase"
import { ProductForm } from "../form"

export default async function NewProductPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business ID
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Create New Loan Product</h1>
            <ProductForm businessId={profile?.business_id} />
        </div>
    )
}
