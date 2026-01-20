import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { LoanReviewActions } from "@/components/admin/loan-actions"
import { formatCurrency } from "@/lib/utils"

export default async function LoanQueuePage() {
    const supabase = await createClient()

    const { data: loans } = await supabase
        .from('loans')
        .select('*, users(full_name, email)')
        .in('status', ['pending', 'submitted', 'under_review'])
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Loan Applications Queue</h1>
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
                                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 capitalize">
                                            {loan.status?.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <a href={`/admin/loans/${loan.id}`} className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                                            Review
                                        </a>
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
