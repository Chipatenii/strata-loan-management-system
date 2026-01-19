import { createClient } from "@/lib/supabase"
import { ProductForm } from "../form"
import { notFound } from "next/navigation"

export default async function EditProductPage({ params }: { params: { id: string } }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Product with Rates
    const { data: product } = await supabase.from('loan_products')
        .select(`*, loan_product_rates (*)`)
        .eq('id', params.id)
        .single()

    if (!product) notFound()

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Edit Product: {product.name}</h1>
            <ProductForm businessId={product.business_id} product={product} />
        </div>
    )
}
