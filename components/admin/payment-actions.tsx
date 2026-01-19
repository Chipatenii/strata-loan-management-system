'use client'

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useTransition } from "react"
import { reconcilePayment } from "@/lib/actions/admin"

import { toast } from "sonner"

export function PaymentReviewActions({ paymentId }: { paymentId: string }) {
    const [pending, startTransition] = useTransition()

    const handleAction = (action: 'approve' | 'reject') => {
        const msg = action === 'approve' ? "Confirm valid payment?" : "Mark payment as invalid?"
        if (!confirm(msg)) return

        startTransition(async () => {
            const res = await reconcilePayment(paymentId, action)
            if (res.error) toast.error(res.error)
            else toast.success(`Payment ${action === 'approve' ? 'Reconciled' : 'Rejected'}`)
        })
    }

    return (
        <div className="flex justify-end gap-2">
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleAction('reject')} disabled={pending}>
                <X className="h-4 w-4 text-red-500" />
            </Button>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleAction('approve')} disabled={pending}>
                <Check className="h-4 w-4 text-green-500" />
            </Button>
        </div>
    )
}
