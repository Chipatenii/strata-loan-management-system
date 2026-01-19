import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

export default async function CustomersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business ID
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

    // Fetch Customers
    const { data: customers } = await supabase
        .from('users')
        .select(`
            id,
            email,
            full_name,
            phone_number,
            created_at,
            kyc_records (status)
        `)
        .eq('business_id', profile?.business_id)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Registered Customers</CardTitle>
                    <CardDescription>
                        List of all borrowers registered under your business.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {customers && customers.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>KYC Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {customers.map((customer) => {
                                    const kycStatus = customer.kyc_records?.[0]?.status || 'not_submitted'
                                    return (
                                        <TableRow key={customer.id}>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {format(new Date(customer.created_at), 'MMM d, yyyy')}
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {customer.full_name || 'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{customer.email}</span>
                                                    <span className="text-muted-foreground text-xs">{customer.phone_number}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    kycStatus === 'approved' ? 'default' :
                                                        kycStatus === 'pending_review' ? 'secondary' :
                                                            'outline'
                                                }>
                                                    {kycStatus.replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-6 text-muted-foreground">
                            No customers found. Share your invite link to onboard borrowers.
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
