import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { LoanReviewActions } from "@/components/admin/loan-actions"
import { formatCurrency } from "@/lib/utils"
import { User, Banknote, Calendar, FileText } from "lucide-react"
import Link from "next/link"

export default async function LoanQueuePage() {
    const supabase = await createClient()

    // Get current user's business_id for scoping
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Not authenticated</div>

    const { data: profile } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single()

    // Fetch loans scoped to this business
    // Use !loans_user_id_fkey to specify which foreign key relationship to use
    const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('*, users!loans_user_id_fkey(full_name, email)')
        .eq('business_id', profile?.business_id)
        .in('status', ['pending', 'submitted', 'under_review'])
        .order('created_at', { ascending: true })

    // Log errors for debugging
    if (loansError) {
        console.error('Loans Error:', loansError)
    }
    console.log('Loans Count:', loans?.length || 0)
    console.log('Business ID:', profile?.business_id)

    const renderLoanCards = () => {
        if (!loans || loans.length === 0) {
            return (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending loan applications.</p>
                    </CardContent>
                </Card>
            )
        }

        return loans.map((loan: any) => {
            const disbursement = loan.disbursement_details as any
            const methodLabel = loan.disbursement_method === 'mobile_money'
                ? `Mobile Money (${disbursement?.network || ''})`
                : loan.disbursement_method === 'bank_transfer'
                    ? `Bank Transfer (${disbursement?.bank_name || ''})`
                    : loan.disbursement_method || '-'

            return (
                <Card key={loan.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="font-semibold truncate">{loan.users?.full_name || 'Unknown'}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{loan.users?.email}</p>
                            </div>
                            <Badge variant="secondary" className="capitalize flex-shrink-0">
                                {loan.status?.replace('_', ' ')}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-3 pt-0">
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Amount</span>
                                </div>
                                <p className="font-semibold">{formatCurrency(loan.amount)}</p>
                                <p className="text-xs text-muted-foreground">{loan.duration_months} Months</p>
                            </div>
                            <div>
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="text-xs font-medium text-muted-foreground">Disbursement</span>
                                </div>
                                <p className="text-sm font-medium capitalize truncate">{methodLabel}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {loan.disbursement_method === 'mobile_money' ? disbursement?.number : disbursement?.account_number}
                                </p>
                            </div>
                        </div>

                        {loan.collateral_description && (
                            <div className="pt-2 border-t">
                                <p className="text-xs text-muted-foreground">Collateral: {loan.collateral_description}</p>
                            </div>
                        )}

                        <Link
                            href={`/admin/loans/${loan.id}`}
                            className="block w-full text-center py-2 px-4 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                        >
                            Review Application
                        </Link>
                    </CardContent>
                </Card>
            )
        })
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Loan Applications Queue</h1>

            {loansError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                    <p className="font-semibold">Error loading loan applications:</p>
                    <p className="text-sm">{loansError.message}</p>
                </div>
            )}

            {/* Stacked Card View */}
            <div className="space-y-3">
                {renderLoanCards()}
            </div>

            {/* Table View */}
            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Disbursement</TableHead>
                            <TableHead>Collateral</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loans?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No pending loan applications.
                                </TableCell>
                            </TableRow>
                        )}
                        {loans?.map((loan: any) => {
                            const disbursement = loan.disbursement_details as any
                            const methodLabel = loan.disbursement_method === 'mobile_money'
                                ? `Mobile Money (${disbursement?.network || ''})`
                                : loan.disbursement_method === 'bank_transfer'
                                    ? `Bank Transfer (${disbursement?.bank_name || ''})`
                                    : loan.disbursement_method || '-'

                            return (
                                <TableRow key={loan.id}>
                                    <TableCell>
                                        <div className="font-medium">{loan.users?.full_name || 'Unknown'}</div>
                                        <div className="text-xs text-muted-foreground">{loan.users?.email}</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{formatCurrency(loan.amount)}</div>
                                        <div className="text-xs text-muted-foreground">{loan.duration_months} Months</div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="text-xs font-medium capitalize">{methodLabel}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {loan.disbursement_method === 'mobile_money' ? disbursement?.number : disbursement?.account_number}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-xs text-muted-foreground">{loan.collateral_description || 'None'}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="secondary" className="capitalize">
                                            {loan.status?.replace('_', ' ')}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Link
                                            href={`/admin/loans/${loan.id}`}
                                            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                                        >
                                            Review
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
