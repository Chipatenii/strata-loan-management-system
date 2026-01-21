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
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { KycReviewActions } from "@/components/admin/kyc-actions"
import { User, Calendar, Shield, FileText, ExternalLink } from "lucide-react"

export default async function KycQueuePage() {
    const supabase = await createClient()

    // Get current user's business_id for scoping
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Not authenticated</div>

    const { data: profile } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single()

    // Fetch KYC records scoped to this business
    // Use !kyc_records_user_id_fkey to specify which foreign key relationship to use
    const { data: records, error: recordsError } = await supabase
        .from('kyc_records')
        .select('*, users!kyc_records_user_id_fkey(full_name, email, business_id)')
        .eq('status', 'pending_review')
        .eq('users.business_id', profile?.business_id)
        .order('created_at', { ascending: true })



    const renderKycCards = () => {
        if (!records || records.length === 0) {
            return (
                <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                        <Shield className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>No pending KYC requests.</p>
                    </CardContent>
                </Card>
            )
        }

        return records.map((record: any) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                <span className="font-semibold truncate">{record.users?.full_name || 'Unknown'}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{record.users?.email}</p>
                        </div>
                        <Badge variant={record.risk_score > 80 ? 'default' : 'destructive'} className="flex-shrink-0">
                            {record.risk_score || 'N/A'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Submitted</span>
                            </div>
                            <p className="text-sm">{new Date(record.created_at).toLocaleDateString()}</p>
                        </div>
                        <div>
                            <div className="flex items-center gap-1.5 mb-1">
                                <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Risk Score</span>
                            </div>
                            <p className="text-sm font-medium">{record.risk_score || 'N/A'}</p>
                        </div>
                    </div>

                    {(record.id_document_url || record.proof_of_address_url) && (
                        <div className="pt-2 border-t">
                            <div className="flex items-center gap-1.5 mb-2">
                                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Documents</span>
                            </div>
                            <div className="flex gap-2">
                                {record.id_document_url && (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-docs/${record.id_document_url}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        ID <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                                {record.proof_of_address_url && (
                                    <a
                                        href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/kyc-docs/${record.proof_of_address_url}`}
                                        target="_blank"
                                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                                    >
                                        Proof <ExternalLink className="h-3 w-3" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="pt-2">
                        <KycReviewActions recordId={record.id} />
                    </div>
                </CardContent>
            </Card>
        ))
    }

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">KYC Review Queue</h1>
            </div>

            {recordsError && (
                <div className="p-4 bg-destructive/10 text-destructive rounded-md">
                    <p className="font-semibold">Error loading KYC records:</p>
                    <p className="text-sm">{recordsError.message}</p>
                </div>
            )}

            {/* Stacked Card View */}
            <div className="space-y-3">
                {renderKycCards()}
            </div>

            {/* Table View */}
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
