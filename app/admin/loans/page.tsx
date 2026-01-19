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

export default async function LoanQueuePage() {
    const supabase = await createClient()

    const { data: loans } = await supabase
        .from('loans')
        .select('*, users(full_name, email)')
        .eq('status', 'pending')
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
                            <TableHead>Duration</TableHead>
                            <TableHead>Purpose</TableHead>
                            <TableHead>Collateral</TableHead>
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
                        {loans?.map((loan: any) => (
                            <TableRow key={loan.id}>
                                <TableCell>
                                    <div className="font-medium">{loan.users?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{loan.users?.email}</div>
                                </TableCell>
                                <TableCell>MWK {loan.amount.toLocaleString()}</TableCell>
                                <TableCell>{loan.duration_months} Months</TableCell>
                                <TableCell className="max-w-[200px] truncate" title={loan.purpose}>{loan.purpose}</TableCell>
                                <TableCell>
                                    {loan.collateral_image_url ? (
                                        <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collateral/${loan.collateral_image_url}`} target="_blank" className="text-xs underline text-blue-600">View Photo</a>
                                    ) : (
                                        <span className="text-xs text-muted-foreground">{loan.collateral_description || 'None'}</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <LoanReviewActions loanId={loan.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
