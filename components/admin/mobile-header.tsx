'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { SidebarNav } from "./sidebar-nav"
import { Menu, Shield } from "lucide-react"

export function AdminMobileHeader({ businessName }: { businessName: string }) {
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/60 bg-background/80 backdrop-blur-xl px-4 md:hidden">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
          <Shield className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        </div>
        <span className="font-bold text-sm truncate max-w-[160px]">{businessName}</span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="h-8 w-8 border-border/60">
            <Menu className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] bg-sidebar border-r border-sidebar-border px-3 py-6">
          <div className="flex items-center gap-2.5 mb-6 px-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/25 bg-primary/10">
              <Shield className="h-4 w-4 text-primary" strokeWidth={1.5} />
            </div>
            <div>
              <p className="text-sm font-bold truncate">{businessName}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Admin Portal</p>
            </div>
          </div>
          <SidebarNav mobile onItemClick={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </header>
  )
}
