'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, CreditCard, User, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { signout } from "@/lib/actions/auth"

interface PortalNavProps {
    className?: string
    mobile?: boolean
    onItemClick?: () => void
}

export function PortalNav({ className, mobile, onItemClick }: PortalNavProps) {
    const pathname = usePathname()

    const navItems = [
        {
            title: "Dashboard",
            href: "/portal",
            icon: LayoutDashboard
        },
        {
            title: "My Loans",
            href: "/portal/loans",
            icon: Wallet
        },
        {
            title: "Payments",
            href: "/portal/payments",
            icon: CreditCard
        },
        {
            title: "Profile",
            href: "/portal/profile",
            icon: User
        },
    ]

    return (
        <nav className={cn("flex flex-col gap-2", className)}>
            {navItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== '/portal' && pathname?.startsWith(item.href))
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
