import Link from "next/link"
import { LayoutDashboard, Users, FileText, Banknote, ShieldCheck, LogOut } from "lucide-react"
import { signout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) redirect('/auth/admin/login')

    const { data: profile } = await supabase.from('users').select('business_id').eq('id', user.id).single()
    const { data: business } = await supabase.from('businesses').select('name').eq('id', profile?.business_id).single()

    const businessName = business?.name || 'Strata'

    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            {/* Mobile Header (Sticky on Mobile, Static but Offset on Desktop) */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:ml-64 transition-all">
                <div className="flex-1 font-bold text-lg text-primary truncate">{businessName} Admin</div>
                <form action={signout} className="sm:hidden">
                    <Button variant="ghost" size="icon" title="Sign Out">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </form>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 mb-16 sm:mb-0 sm:ml-64 transition-all">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 z-40 w-full border-t bg-background sm:hidden">
                <div className="grid grid-cols-5 h-16">
                    <Link href="/admin" className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        Home
                    </Link>
                    <Link href="/admin/kyc" className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                        <ShieldCheck className="h-5 w-5" />
                        KYC
                    </Link>
                    <Link href="/admin/loans" className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                        <FileText className="h-5 w-5" />
                        Loans
                    </Link>
                    <Link href="/admin/payments" className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                        <Banknote className="h-5 w-5" />
                        Pay
                    </Link>
                    <Link href="/admin/customers" className="flex flex-col items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                        <Users className="h-5 w-5" />
                        Users
                    </Link>
                    {/* Note: Reports is 6th item, hidden on mobile grid unless we adjust columns or scroll.
                        Max 5 items is standard. We'll skip adding Reports to mobile bottom nav as requested layout density 
                        improvements suggest minimizing clutter, but sidebar has it. */}
                </div>
            </nav>

            {/* Desktop Sidebar (Hidden on mobile) */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-64 flex-col border-r bg-background sm:flex p-4 transition-all">
                {/* Replicate mobile nav as sidebar items */}
                <div className="font-bold text-xl text-primary mb-8 px-2 truncate" title={businessName}>{businessName}</div>
                <nav className="flex flex-col gap-4 px-2 overflow-y-auto">
                    <Link href="/admin" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/admin/kyc" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <ShieldCheck className="h-5 w-5" />
                        KYC Requests
                    </Link>
                    <Link href="/admin/loans" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <FileText className="h-5 w-5" />
                        Loan Applications
                    </Link>
                    <Link href="/admin/payments" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <Banknote className="h-5 w-5" />
                        Payments
                    </Link>
                    <Link href="/admin/customers" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <Users className="h-5 w-5" />
                        Customers
                    </Link>
                    <Link href="/admin/reports" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <FileText className="h-5 w-5" />
                        Reports
                    </Link>
                    <Link href="/admin/products" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <Banknote className="h-5 w-5" />
                        Loan Products
                    </Link>
                    <Link href="/admin/settings" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <ShieldCheck className="h-5 w-5" />
                        Settings
                    </Link>
                    <form action={signout} className="mt-auto">
                        <button className="flex items-center gap-3 text-sm font-medium text-red-500 hover:text-red-600">
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </button>
                    </form>
                </nav>
            </aside>
        </div>
    )
}
