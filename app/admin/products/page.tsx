import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Edit } from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"

export default async function ProductsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business Products
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: products } = await supabase.from('loan_products')
        .select(`
            *,
            loan_product_rates (*)
        `)
        .eq('business_id', profile?.business_id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Loan Products</h1>
                <Link href="/admin/products/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Product
                    </Button>
                </Link>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Active Products</CardTitle>
                    <CardDescription>
                        Manage your loan offerings and interest rates.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {products && products.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Rates</TableHead>
                                    <TableHead>Limits</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="font-medium">
                                            <div>{product.name}</div>
                                            <div className="text-xs text-muted-foreground">{product.description}</div>
                                        </TableCell>
                                        <TableCell>
                                            {product.loan_product_rates && product.loan_product_rates.length > 0 ? (
                                                <div className="flex flex-col gap-1">
                                                    {product.loan_product_rates.map((rate: any) => (
                                                        <Badge key={rate.id} variant="secondary" className="w-fit text-xs">
                                                            {rate.duration_value} {rate.duration_unit}(s) @ {rate.interest_rate}%
                                                        </Badge>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground text-sm">No rates configured</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm">
                                                Min: {product.min_amount ? formatCurrency(product.min_amount) : 'N/A'}
                                            </div>
                                            <div className="text-sm">
                                                Max: {product.max_amount ? formatCurrency(product.max_amount) : 'N/A'}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={product.is_active ? 'default' : 'destructive'}>
                                                {product.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm" asChild>
                                                <Link href={`/admin/products/${product.id}`}>
                                                    <Edit className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            No loan products found. Create one to get started.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
