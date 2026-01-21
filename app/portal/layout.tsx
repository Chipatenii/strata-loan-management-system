import Link from "next/link"
import { LogOut } from "lucide-react"
import { signout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { PortalNav } from "@/components/portal/portal-nav"
import { PortalMobileHeader } from "@/components/portal/mobile-header"

export default function PortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen flex-col md:flex-row bg-muted/20">
            {/* Mobile Header */}
            {/* Mobile Header */}
            <PortalMobileHeader />

            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden w-64 flex-col border-r bg-background md:flex fixed inset-y-0 left-0 z-20">
                <div className="h-14 flex items-center border-b px-6">
                    <span className="font-bold text-lg text-primary">Strata</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4 px-3">
                    <PortalNav />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 md:ml-64 transition-all">
                <div className="h-full p-4 md:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
