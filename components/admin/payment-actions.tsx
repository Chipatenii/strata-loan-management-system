'use client'

import { Button } from "@/components/ui/button"
import { Check, X, Loader2 } from "lucide-react"
import { useState, useTransition } from "react"
import { reconcilePayment } from "@/lib/actions/payments-review"
import { toast } from "sonner"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

export function PaymentReviewActions({ paymentId }: { paymentId: string }) {
    const [pending, startTransition] = useTransition()
    const [showRejectDialog, setShowRejectDialog] = useState(false)
    const [rejectionReason, setRejectionReason] = useState('')

    const handleApprove = () => {
        if (!confirm("Confirm this payment is valid and should be recorded in the ledger?")) return

        startTransition(async () => {
            const res = await reconcilePayment(paymentId, 'approve')
            if (res.error) toast.error(res.error)
            else toast.success("Payment approved and recorded in ledger")
        })
    }

    const handleReject = () => {
        if (!rejectionReason.trim()) {
            toast.error("Please provide a rejection reason")
            return
        }

        setShowRejectDialog(false)
        startTransition(async () => {
            const res = await reconcilePayment(paymentId, 'reject', rejectionReason)
            if (res.error) toast.error(res.error)
            else toast.success("Payment rejected")
            setRejectionReason('')
        })
    }

    return (
        <>
            <div className="flex justify-end gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={pending}
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                    Reject
                </Button>
                <Button
                    size="sm"
                    variant="default"
                    className="h-8 px-3 bg-green-600 hover:bg-green-700"
                    onClick={handleApprove}
                    disabled={pending}
                >
                    {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                    Approve
                </Button>
            </div>

            {/* Rejection Reason Dialog */}
            <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Payment</DialogTitle>
                        <DialogDescription>
                            Please provide a reason for rejecting this payment. This will be visible to the customer.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="reason">Rejection Reason</Label>
                            <Textarea
                                id="reason"
                                placeholder="e.g., Reference code not found, Amount mismatch, Invalid proof..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={!rejectionReason.trim() || pending}
                        >
                            {pending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            Confirm Rejection
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
