import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Copy, Plus } from "lucide-react"
import Link from "next/link"

export default async function AdminDashboard() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch Business Code
    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('*').eq('id', profile?.business_id).single()

    // Mock KPIs for now, but Invite Widget is real
    const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/customer/sign-up?code=${business?.code}`

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">Admin Overview</h1>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Disbursed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">MWK 0.00</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending KYC
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pending Loans
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Outstanding Balance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">MWK 0.00</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Invite Customers</CardTitle>
                        <CardDescription>Share this link to onboard new borrowers.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <div className="grid flex-1 gap-2">
                                <label htmlFor="link" className="sr-only">Link</label>
                                <div className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground">
                                    {inviteLink}
                                </div>
                            </div>
                            {/* In a real client component we'd add copy functionality, simplistic here */}
                            <Button size="sm" className="px-3">
                                <span className="sr-only">Copy</span>
                                <Copy className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Business Code: <strong className="text-foreground">{business?.code}</strong></span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Quick Actions</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <Link href="/admin/products">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="mr-2 h-4 w-4" />
                                Create Loan Product
                            </Button>
                        </Link>
                        <Link href="/admin/loans">
                            <Button variant="outline" className="w-full justify-start">
                                <Plus className="mr-2 h-4 w-4" />
                                Review Applications
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
