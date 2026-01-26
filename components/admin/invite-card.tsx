"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"
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
        <Card className="col-span-full md:col-span-2 lg:col-span-4">
            <CardHeader>
                <CardTitle>Invite Customers</CardTitle>
                <CardDescription>Share this link to onboard new borrowers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Mobile-first responsive layout */}
                <div className="flex flex-col md:flex-row gap-3 md:gap-2">
                    <div className="flex-1 min-w-0 min-h-0">
                        <label htmlFor="invite-link" className="sr-only">Invite Link</label>
                        <div
                            id="invite-link"
                            className="flex h-10 w-full items-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground"
                        >
                            <span className="truncate block w-full">{inviteLink}</span>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        className="px-4 md:px-3 w-full md:w-auto flex items-center justify-center gap-2"
                        onClick={handleCopy}
                    >
                        {copied ? (
                            <>
                                <Check className="h-4 w-4" />
                                <span className="md:sr-only">Copied</span>
                            </>
                        ) : (
                            <>
                                <Copy className="h-4 w-4" />
                                <span className="md:sr-only">Copy Link</span>
                            </>
                        )}
                    </Button>
                </div>

                {/* Business Code Display */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                        Business Code: <strong className="text-foreground text-base">{businessCode}</strong>
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
