import { createClient } from "@/lib/supabase"
import { notFound, redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { LoanDecisionPanel } from "@/components/admin/loan-decision-panel"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"

export default async function AdminLoanDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id } = await params

    // Get current user and business_id
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return <div>Not authenticated</div>

    const { data: profile } = await supabase
        .from('users')
        .select('business_id')
        .eq('id', user.id)
        .single()

    // Fetch Loan with Collateral and User
    const { data: loan } = await supabase
        .from('loans')
        .select(`
            *,
            users:user_id ( full_name, email, phone ),
            loan_collateral (*)
        `)
        .eq('id', id)
        .single()

    if (!loan) notFound()

    // Fetch KYC
    const { data: kyc } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('user_id', loan.user_id)
        .single()

    const disbursement = loan.disbursement_details as any

    return (
        <div className="space-y-6 max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Link href="/admin/loans">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Queue
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold tracking-tight">Loan Application Details</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content: Application & Collateral */}
                <div className="md:col-span-2 space-y-6">
                    {/* Snapshot Card */}
                    <Card className="border-primary/20 bg-primary/5">
                        <CardHeader>
                            <CardTitle className="text-lg text-primary">Repayment Snapshot</CardTitle>
                            <CardDescription>Locked values at submission time</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Requested</p>
                                <p className="font-semibold">{formatCurrency(loan.principal_amount || loan.amount)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Interest ({loan.interest_rate_pct_used || loan.interest_rate}%)</p>
                                <p className="font-semibold text-destructive">+ {formatCurrency(loan.interest_amount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Duration</p>
                                <p className="font-semibold">{loan.duration_months} Months</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Total Payable</p>
                                <p className="font-bold text-lg">{formatCurrency(loan.total_payable_amount || 0)}</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disbursement Info */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Disbursement Instructions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-2 mb-4">
                                <Badge variant="outline" className="uppercase">{loan.disbursement_method?.replace('_', ' ')}</Badge>
                            </div>
                            {loan.disbursement_method === 'mobile_money' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Network</p>
                                        <p className="font-medium capitalize">{disbursement?.network}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Mobile Number</p>
                                        <p className="font-mono">{disbursement?.number}</p>
                                    </div>
                                </div>
                            )}
                            {loan.disbursement_method === 'bank_transfer' && (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Bank Name</p>
                                            <p className="font-medium">{disbursement?.bank_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Account Number</p>
                                            <p className="font-mono">{disbursement?.account_number}</p>
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Name</p>
                                        <p className="font-medium">{disbursement?.account_name}</p>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Collateral Gallery */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Collateral ({loan.loan_collateral?.length || 0})</CardTitle>
                            <CardDescription>{loan.collateral_description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {loan.loan_collateral && loan.loan_collateral.length > 0 ? (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                    {loan.loan_collateral.map((col: any) => (
                                        <a
                                            key={col.id}
                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collateral/${col.image_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block aspect-square rounded-lg border bg-muted/20 relative overflow-hidden hover:opacity-90 transition-opacity"
                                        >
                                            {/* Note: In a real app we'd use Next/Image with auth tokens if private, or simple img tag if public URLs */}
                                            <img
                                                src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/collateral/${col.image_url}`}
                                                alt="Collateral"
                                                className="object-cover w-full h-full"
                                            />
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity">
                                                <ExternalLink className="text-white h-6 w-6" />
                                            </div>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-muted-foreground text-sm">No collateral images found.</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar: Borrower Profile & Actions */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Borrower Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Full Name</p>
                                <p className="font-semibold">{loan.users?.full_name}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Contact</p>
                                <p className="text-sm">{loan.users?.email}</p>
                                <p className="text-sm">{loan.users?.phone}</p>
                            </div>

                            {/* Extended KYC */}
                            {kyc && (
                                <div className="pt-4 border-t space-y-3">
                                    <h4 className="font-semibold text-sm">Employment</h4>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Status</p>
                                        <Badge variant="outline" className="capitalize">{kyc.employment_status}</Badge>
                                    </div>
                                    {kyc.monthly_income && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Monthly Income</p>
                                            <p className="text-sm font-medium">{formatCurrency(kyc.monthly_income)}</p>
                                        </div>
                                    )}

                                    <h4 className="font-semibold text-sm pt-2">Next of Kin</h4>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Name & Relation</p>
                                        <p className="text-sm">{kyc.nok_full_name} ({kyc.nok_relationship})</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Contact</p>
                                        <p className="text-sm">{kyc.nok_phone}</p>
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t">
                                <Link href={`/admin/customers/${loan.user_id}`} className="text-xs text-primary underline">
                                    View Full Customer Profile
                                </Link>
                            </div>
                        </CardContent>
                    </Card>

                    <LoanDecisionPanel
                        loanId={loan.id}
                        currentStatus={loan.status}
                        businessId={profile?.business_id!}
                    />
                </div>
            </div>
        </div>
    )
}
