"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, Share2 } from "lucide-react"
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
            toast.success("Invite link copied")

            // Reset icon after 2 seconds
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Copy failed:', error)
            toast.error("Copy failed. Please try again.")
        }
    }

    return (
        <Card className="col-span-full md:col-span-2 lg:col-span-4 relative overflow-hidden transition-all hover:shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
                <div className="space-y-1">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        Invite Customers
                    </CardTitle>
                    <CardDescription className="text-xs">Share this link to onboard new borrowers.</CardDescription>
                </div>
                <div className="rounded-full bg-primary/10 p-2">
                    <Share2 className="h-4 w-4 text-primary" />
                </div>
            </CardHeader>
            <CardContent className="space-y-4 relative">
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 min-w-0">
                        <label htmlFor="invite-link" className="sr-only">Invite Link</label>
                        <div
                            id="invite-link"
                            className="flex h-10 w-full items-center rounded-md border border-input bg-background/50 px-3 py-2 text-sm text-muted-foreground"
                        >
                            <span className="truncate block w-full">{inviteLink}</span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="px-4 w-full sm:w-auto flex items-center justify-center gap-2"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span>Copy Link</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Business Code Display */}
                <div className="text-xs text-muted-foreground">
                    Business Code: <strong className="text-foreground text-sm">{businessCode}</strong>
                </div>
            </CardContent>
        </Card>
    )
}
