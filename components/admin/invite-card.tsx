"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Share2, Link as LinkIcon } from "lucide-react"
import { toast } from "sonner"
import { useState } from "react"

interface InviteCardProps {
  inviteLink: string
  businessCode: string
}

export function InviteCard({ inviteLink, businessCode }: InviteCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      setCopied(true)
      toast.success("Invite link copied to clipboard")
      setTimeout(() => setCopied(false), 2500)
    } catch (error) {
      toast.error("Copy failed. Please try again.")
    }
  }

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5 duration-300 kpi-bar-teal">
      {/* Subtle gradient overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />

      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 relative">
        <div className="space-y-1">
          <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Invite Customers
          </CardTitle>
          <CardDescription className="text-sm font-medium text-foreground">
            Share this link to onboard new borrowers
          </CardDescription>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 border border-primary/20">
          <Share2 className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative">
        {/* Invite link field */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 min-w-0">
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <LinkIcon className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div
              className="flex h-10 w-full items-center rounded-lg border border-input bg-input pl-8 pr-3 text-sm text-muted-foreground overflow-hidden"
            >
              <span className="truncate block w-full">{inviteLink}</span>
            </div>
            {/* Shimmer effect on the link field */}
            <div className="pointer-events-none absolute inset-0 rounded-lg animate-shimmer" />
          </div>
          <Button
            size="sm"
            className={`shrink-0 w-full sm:w-auto gap-2 transition-all duration-300 ${copied ? 'bg-emerald-500 hover:brightness-105' : ''}`}
            variant={copied ? "default" : "glow"}
            onClick={handleCopy}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy Link
              </>
            )}
          </Button>
        </div>

        {/* Business code */}
        <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Business Code:</span>
          <code className="text-sm font-bold text-foreground tracking-widest">{businessCode}</code>
        </div>
      </CardContent>
    </Card>
  )
}
