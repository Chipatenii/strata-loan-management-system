import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function LoansListPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    const { data: loans } = await supabase
        .from('loans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight">My Loans</h1>
                <Link href="/portal/loans/new">
                    <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Request Loan
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4">
                {loans?.length === 0 && (
                    <Card>
                        <CardContent className="py-8 text-center text-muted-foreground">
                            You have no loan history.
                        </CardContent>
                    </Card>
                )}
                {loans?.map((loan: any) => (
                    <Card key={loan.id}>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-base font-medium">
                                Loan #{loan.id.slice(0, 8)}
                            </CardTitle>
                            <Badge variant={loan.status === 'active' ? 'default' : 'secondary'}>
                                {loan.status}
                            </Badge>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">MWK {loan.amount.toLocaleString()}</div>
                            <p className="text-xs text-muted-foreground">
                                {loan.duration_months} Months • {loan.purpose}
                            </p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
