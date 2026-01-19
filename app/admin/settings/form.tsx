'use client'

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTransition, useState } from "react"
import { updatePaymentConfig } from "@/lib/actions/business"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export function PaymentSettingsForm({ businessId, initialConfig }: { businessId: string, initialConfig: any }) {
    const [pending, startTransition] = useTransition()
    const [mobileMoney, setMobileMoney] = useState(initialConfig.mobile_money_instructions || '')
    const [bankTransfer, setBankTransfer] = useState(initialConfig.bank_transfer_instructions || '')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            const result = await updatePaymentConfig(businessId, {
                mobile_money_instructions: mobileMoney,
                bank_transfer_instructions: bankTransfer
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success("Payment settings updated")
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="mobile_money">Mobile Money Instructions</Label>
                <Textarea
                    id="mobile_money"
                    placeholder="e.g. Send to Airtel Money 0123456789 (Name)"
                    className="min-h-[100px]"
                    value={mobileMoney}
                    onChange={(e) => setMobileMoney(e.target.value)}
                    disabled={pending}
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="bank_transfer">Bank Transfer Instructions</Label>
                <Textarea
                    id="bank_transfer"
                    placeholder="e.g. Bank Name, Account Number, Branch"
                    className="min-h-[100px]"
                    value={bankTransfer}
                    onChange={(e) => setBankTransfer(e.target.value)}
                    disabled={pending}
                />
            </div>

            <Button type="submit" disabled={pending}>
                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Save Settings"}
            </Button>
        </form>
    )
}
