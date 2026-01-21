'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"
import { Menu } from "lucide-react"

export function AdminMobileHeader({ businessName }: { businessName: string }) {
    const [open, setOpen] = useState(false)

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
            <div className="font-bold text-lg truncate">{businessName}</div>
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] px-3 py-6">
                    <div className="font-bold text-lg mb-6 px-2">{businessName}</div>
                    <SidebarNav mobile onItemClick={() => setOpen(false)} />
                </SheetContent>
            </Sheet>
        </header>
    )
}
