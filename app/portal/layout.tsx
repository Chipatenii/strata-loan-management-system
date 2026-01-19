import Link from "next/link"
import { LayoutDashboard, Wallet, CreditCard, User, LogOut } from "lucide-react"
import { signout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col bg-muted/20">
            {/* Mobile Header (Sticky) */}
            <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="flex-1 font-semibold text-lg text-primary">Strata</div>
                <form action={signout}>
                    <Button variant="ghost" size="icon" title="Sign Out">
                        <LogOut className="h-5 w-5" />
                    </Button>
                </form>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 mb-16 sm:mb-0 sm:ml-[200px]">
                {children}
            </main>

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 z-40 w-full border-t bg-background sm:hidden">
                <div className="grid grid-cols-4 h-16">
                    <Link href="/portal" className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        Home
                    </Link>
                    <Link href="/portal/loans" className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <Wallet className="h-5 w-5" />
                        Loans
                    </Link>
                    <Link href="/portal/payments" className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <CreditCard className="h-5 w-5" />
                        Pay
                    </Link>
                    <Link href="/portal/profile" className="flex flex-col items-center justify-center gap-1 text-xs text-muted-foreground hover:text-primary">
                        <User className="h-5 w-5" />
                        Profile
                    </Link>
                </div>
            </nav>

            {/* Desktop Sidebar (Hidden on mobile) */}
            <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex min-w-[200px] p-4">
                {/* Replicate mobile nav as sidebar items */}
                <div className="font-bold text-xl text-primary mb-8 px-2">Strata</div>
                <nav className="flex flex-col gap-4 px-2">
                    <Link href="/portal" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <LayoutDashboard className="h-5 w-5" />
                        Dashboard
                    </Link>
                    <Link href="/portal/loans" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <Wallet className="h-5 w-5" />
                        My Loans
                    </Link>
                    <Link href="/portal/payments" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <CreditCard className="h-5 w-5" />
                        Payments
                    </Link>
                    <Link href="/portal/profile" className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-primary">
                        <User className="h-5 w-5" />
                        Profile
                    </Link>
                    <form action={signout} className="mt-auto">
                        <button className="flex items-center gap-3 text-sm font-medium text-red-500 hover:text-red-600">
                            <LogOut className="h-5 w-5" />
                            Sign Out
                        </button>
                    </form>
                </nav>
            </aside>

            {/* Spacer for desktop sidebar */}
            <div className="hidden sm:block sm:pl-[200px]">
                {/* This div just pushes content if we used position fixed for sidebar, 
               but main is flex-1. Actually, we need to wrap main content properly for desktop.
               Let's adjust the structure.
           */}
                {/* 
                Correction: The MAIN content above should utilize margin-left on desktop 
                OR we wrap Layout properly.
            */}
            </div>
        </div>
    )
}
