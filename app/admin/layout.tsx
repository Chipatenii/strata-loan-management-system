import Link from "next/link"
import { LogOut } from "lucide-react"
import { signout } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { SidebarNav } from "@/components/admin/sidebar-nav"
import { AdminMobileHeader } from "@/components/admin/mobile-header"

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
        <div className="flex min-h-screen flex-col md:flex-row bg-muted/20">
            {/* Mobile Header */}
            {/* Mobile Header */}
            <AdminMobileHeader businessName={businessName} />

            {/* Desktop Sidebar (Fixed) */}
            <aside className="hidden w-64 flex-col border-r bg-background md:flex fixed inset-y-0 left-0 z-20">
                <div className="h-14 flex items-center border-b px-6">
                    <span className="font-bold text-lg truncate">{businessName}</span>
                </div>
                <div className="flex-1 overflow-y-auto py-4 px-3">
                    <SidebarNav />
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
