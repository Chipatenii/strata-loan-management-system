'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Wallet, CreditCard, User, LogOut, ShieldCheck } from "lucide-react"
import { cn } from "@/lib/utils"
import { signout } from "@/lib/actions/auth"

interface PortalNavProps {
  className?: string
  mobile?: boolean
  onItemClick?: () => void
}

const navItems = [
  { title: "Dashboard", href: "/portal",          icon: LayoutDashboard },
  { title: "My Loans",  href: "/portal/loans",    icon: Wallet          },
  { title: "Payments",  href: "/portal/payments", icon: CreditCard      },
  { title: "KYC / ID",  href: "/portal/kyc",      icon: ShieldCheck     },
  { title: "Profile",   href: "/portal/profile",  icon: User            },
]

export function PortalNav({ className, mobile, onItemClick }: PortalNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/portal' && pathname?.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onItemClick}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
              isActive
                ? "nav-item-active"
                : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-4 w-4 shrink-0 transition-colors duration-200",
                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            <span>{item.title}</span>
            {isActive && (
              <div className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Link>
        )
      })}

      <div className="mt-4 border-t border-border/50 pt-4">
        <button
          onClick={() => signout()}
          className="group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="h-4 w-4 shrink-0 transition-colors duration-200 group-hover:text-destructive" />
          Sign Out
        </button>
      </div>
    </nav>
  )
}
