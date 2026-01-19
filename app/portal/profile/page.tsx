import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default async function ProfilePage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: kyc } = await supabase
        .from('kyc_records')
        .select('*')
        .eq('user_id', user.id)
        .single()

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold tracking-tight">My Profile</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Full Name</div>
                        <div className="text-lg">{profile?.full_name || 'Not set'}</div>
                    </div>
                    <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <div>{user.email}</div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>KYC Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-muted-foreground">Status</span>
                        <Badge variant={kyc?.status === 'approved' ? 'default' : 'secondary'}>
                            {kyc?.status || 'Not Submitted'}
                        </Badge>
                    </div>
                    {kyc?.rejection_reason && (
                        <div className="text-sm text-red-500 bg-red-50 p-3 rounded">
                            Reason: {kyc.rejection_reason}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {(!kyc || kyc.status === 'not_submitted' || kyc.status === 'rejected') && (
                        <Button asChild className="w-full">
                            <Link href="/portal/kyc">Complete Verification</Link>
                        </Button>
                    )}
                    {kyc?.status === 'pending_review' && (
                        <Button variant="outline" className="w-full" disabled>
                            Verification In Progress
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}
