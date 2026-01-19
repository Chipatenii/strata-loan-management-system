import { createClient } from "@/lib/supabase"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KycReviewActions } from "@/components/admin/kyc-actions"

export default async function KycQueuePage() {
    const supabase = createClient()

    // Fetch pending KYC
    // We need to join with users to get names.
    // Supabase join syntax: select('*, users(full_name, email)')
    const { data: records } = await supabase
        .from('kyc_records')
        .select('*, users(full_name, email)')
        .eq('status', 'pending_review')
        .order('created_at', { ascending: true })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">KYC Review Queue</h1>
            </div>

            <div className="rounded-md border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>Risk Score</TableHead>
                            <TableHead>Documents</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {records?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No pending KYC requests.
                                </TableCell>
                            </TableRow>
                        )}
                        {records?.map((record: any) => (
                            <TableRow key={record.id}>
                                <TableCell>
                                    <div className="font-medium">{record.users?.full_name || 'Unknown'}</div>
                                    <div className="text-xs text-muted-foreground">{record.users?.email}</div>
                                </TableCell>
                                <TableCell>{new Date(record.created_at).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    <Badge variant={record.risk_score > 80 ? 'default' : 'destructive'}>
                                        {record.risk_score || 'N/A'}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex gap-2">
                                        {record.id_document_url && (
                                            <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-docs/${record.id_document_url}`} target="_blank" className="text-xs underline text-blue-600">ID</a>
                                        )}
                                        {record.proof_of_address_url && (
                                            <a href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-docs/${record.proof_of_address_url}`} target="_blank" className="text-xs underline text-blue-600">Proof</a>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <KycReviewActions recordId={record.id} />
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
