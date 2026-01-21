'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useState, useTransition } from "react"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { approveLoan, rejectLoan } from "@/lib/actions/loans-review"
import { showErrorToast, showSuccessToast } from "@/lib/errors"
import { useRouter } from "next/navigation"

export function LoanDecisionPanel({
    loanId,
    currentStatus,
    businessId
}: {
    loanId: string
    currentStatus: string
    businessId: string
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [notes, setNotes] = useState('')
    const [showRejectForm, setShowRejectForm] = useState(false)

    const handleApprove = () => {
        if (!confirm('Are you sure you want to approve this loan application?')) return

        startTransition(async () => {
            const result = await approveLoan({ loanId, businessId, notes })

            if (result?.error) {
                showErrorToast(result.error, result.requestId)
            } else {
                showSuccessToast('Loan approved successfully!')
                router.push('/admin/loans')
                router.refresh()
            }
        })
    }

    const handleReject = () => {
        if (!notes.trim()) {
            showErrorToast('Please provide a rejection reason')
            return
        }

        if (!confirm('Are you sure you want to reject this loan application?')) return

        startTransition(async () => {
            const result = await rejectLoan({ loanId, businessId, notes })

            if (result?.error) {
                showErrorToast(result.error, result.requestId)
            } else {
                showSuccessToast('Loan rejected')
                router.push('/admin/loans')
                router.refresh()
            }
        })
    }

    const isDecided = ['approved', 'rejected', 'disbursed', 'active'].includes(currentStatus)

    if (isDecided) {
        return (
            <Card className="border-2">
                <CardHeader>
                    <CardTitle>Decision Made</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        This application has already been {currentStatus}.
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border-2 border-primary">
            <CardHeader>
                <CardTitle>Make Decision</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {!showRejectForm ? (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="notes">Notes (optional)</Label>
                            <Textarea
                                id="notes"
                                placeholder="Add any notes or conditions..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleApprove}
                                disabled={pending}
                                className="flex-1 gap-2 bg-green-600 hover:bg-green-700"
                            >
                                {pending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <CheckCircle2 className="h-4 w-4" />
                                )}
                                Approve
                            </Button>

                            <Button
                                onClick={() => setShowRejectForm(true)}
                                disabled={pending}
                                variant="destructive"
                                className="flex-1 gap-2"
                            >
                                <XCircle className="h-4 w-4" />
                                Reject
                            </Button>
                        </div>
                    </>
                ) : (
                    <>
                        <div className="space-y-2">
                            <Label htmlFor="reject-reason">Rejection Reason (required)</Label>
                            <Textarea
                                id="reject-reason"
                                placeholder="Explain why this application is being rejected..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={4}
                                required
                            />
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={() => {
                                    setShowRejectForm(false)
                                    setNotes('')
                                }}
                                disabled={pending}
                                variant="outline"
                                className="flex-1"
                            >
                                Cancel
                            </Button>

                            <Button
                                onClick={handleReject}
                                disabled={pending || !notes.trim()}
                                variant="destructive"
                                className="flex-1 gap-2"
                            >
                                {pending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <XCircle className="h-4 w-4" />
                                )}
                                Confirm Rejection
                            </Button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
