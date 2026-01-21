'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Users, FileText, Banknote, ShieldCheck, LogOut, FileBarChart, Settings, Tags } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signout } from "@/lib/actions/auth"

interface SidebarNavProps {
    className?: string
    mobile?: boolean
    onItemClick?: () => void
}

export function SidebarNav({ className, mobile, onItemClick }: SidebarNavProps) {
    const pathname = usePathname()

    const navItems = [
        {
            title: "Dashboard",
            href: "/admin",
            icon: LayoutDashboard
        },
        {
            title: "KYC Requests",
            href: "/admin/kyc",
            icon: ShieldCheck
        },
        {
            title: "Loan Applications",
            href: "/admin/loans",
            icon: FileText
        },
        {
            title: "Payments",
            href: "/admin/payments",
            icon: Banknote
        },
        {
            title: "Customers",
            href: "/admin/customers",
            icon: Users
        },
        {
            title: "Reports",
            href: "/admin/reports",
            icon: FileBarChart
        },
        {
            title: "Loan Products",
            href: "/admin/products",
            icon: Tags
        },
        {
            title: "Settings",
            href: "/admin/settings",
            icon: Settings
        },
    ]

    return (
        <nav className={cn("flex flex-col gap-2", className)}>
            {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname?.startsWith(item.href))
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={onItemClick}
                        className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground",
                            isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground"
                        )}
                    >
                        <item.icon className="h-4 w-4" />
                        {item.title}
                    </Link>
                )
            })}

            {!mobile && (
                <div className="mt-auto px-3 py-2">
                    <Button
                        variant="ghost"
                        className="w-full justify-start gap-3 p-0 h-auto text-red-500 hover:text-red-600 hover:bg-transparent"
                        onClick={() => signout()}
                    >
                        <LogOut className="h-4 w-4" />
                        Sign Out
                    </Button>
                </div>
            )}
        </nav>
    )
}
