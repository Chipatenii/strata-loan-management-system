'use client'

import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { useTransition } from "react"

import { approveKyc, rejectKyc } from "@/lib/actions/kyc-review"
import { toast } from "sonner"

export function KycReviewActions({ recordId, businessId }: { recordId: string, businessId: string }) {
    const [pending, startTransition] = useTransition()

    const handleApprove = () => {
        startTransition(async () => {
            const res = await approveKyc({ recordId, businessId })
            if (res.error) toast.error(res.error)
            else toast.success("KYC Approved")
        })
    }

    const handleReject = () => {
        const reason = prompt("Enter rejection reason:")
        if (!reason) return

        startTransition(async () => {
            const res = await rejectKyc({ recordId, businessId, reason })
            if (res.error) toast.error(res.error)
            else toast.success("KYC Rejected")
        })
    }

    return (
        <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleReject} disabled={pending}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={handleApprove} disabled={pending}>
                <Check className="h-4 w-4 text-green-500" />
            </Button>
        </div>
    )
}
