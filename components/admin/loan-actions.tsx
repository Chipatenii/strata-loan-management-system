'use client'

import { Button } from "@/components/ui/button"
import { Check, X } from "lucide-react"
import { useTransition } from "react"
import { approveLoan, rejectLoan } from "@/lib/actions/admin"
import { toast } from "sonner"

export function LoanReviewActions({ loanId }: { loanId: string }) {
    const [pending, startTransition] = useTransition()

    const handleApprove = () => {
        if (!confirm("Approve this loan? This will disburse funds (simulation) and start interest.")) return
        startTransition(async () => {
            const res = await approveLoan(loanId)
            if (res.error) toast.error(res.error)
            else toast.success("Loan Approved & Disbursed")
        })
    }

    const handleReject = () => {
        if (!confirm("Reject this loan application?")) return
        startTransition(async () => {
            const res = await rejectLoan(loanId)
            if (res.error) toast.error(res.error)
            else toast.success("Loan Rejected")
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
