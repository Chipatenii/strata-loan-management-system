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
import { User, Mail, Phone, Calendar, Shield } from "lucide-react"

export default async function CustomersPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business ID
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()

    // Fetch Customers
    // Use !kyc_records_user_id_fkey to specify which foreign key relationship to use
    const { data: customers, error: customersError } = await supabase
        .from('users')
        .select(`
            id,
            email,
            full_name,
            phone,
            created_at,
            kyc_records!kyc_records_user_id_fkey(status)
        `)
        .eq('business_id', profile?.business_id)
        .eq('role', 'customer')
        .order('created_at', { ascending: false })



    const renderCustomerCards = () => {
        if (!customers || customers.length === 0) {
            return (
                <div className="text-center py-12 text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No customers found.</p>
                    <p className="text-xs mt-1">Share your invite link to onboard borrowers.</p>
                </div>
            )
        }

        return customers.map((customer) => {
            const kycStatus = customer.kyc_records?.[0]?.status || 'not_submitted'
            return (
                <Card key={customer.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-semibold truncate">{customer.full_name || 'N/A'}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    <span>Joined {format(new Date(customer.created_at), 'MMM d, yyyy')}</span>
                                </div>
                            </div>
                            <Badge variant={
                                kycStatus === 'approved' ? 'default' :
                                    kycStatus === 'pending_review' ? 'secondary' :
                                        'outline'
                            } className="flex-shrink-0 capitalize">
                                {kycStatus.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-2 pt-0">
                        <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="truncate">{customer.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                            <span>{customer.phone || 'N/A'}</span>
                        </div>
                    </CardContent>
                </Card>
            )
        })
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
            </div>

            {customersError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                    <p className="font-semibold">Error loading customers:</p>
                    <p className="text-sm">{customersError.message}</p>
                </div>
            )}

            {/* Stacked Card View */}
            <div className="space-y-3">
                {renderCustomerCards()}
            </div>

            {/* Table View */}
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
                                                    <span className="text-muted-foreground text-xs">{customer.phone || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={
                                                    kycStatus === 'approved' ? 'default' :
                                                        kycStatus === 'pending_review' ? 'secondary' :
                                                            'outline'
                                                } className="capitalize">
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
