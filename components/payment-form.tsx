'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function PaymentForm({ userId, loans }: { userId: string, loans: any[] }) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    const [loanId, setLoanId] = useState<string>(loans.length > 0 ? loans[0].id : '')
    const [amount, setAmount] = useState('')
    const [method, setMethod] = useState('mobile_money')
    const [provider, setProvider] = useState('')
    const [reference, setReference] = useState('')
    const [proofFile, setProofFile] = useState<File | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!loanId) {
            toast.error("Please select a loan to pay towards.")
            return
        }

        startTransition(async () => {
            try {
                const supabase = createBrowserSupabaseClient()
                let proofPath = null

                // Upload Proof
                if (proofFile) {
                    const timestamp = Date.now()
                    const { data, error } = await supabase.storage
                        .from('payment-proofs')
                        .upload(`${userId}/${loanId}/${timestamp}_${proofFile.name}`, proofFile)
                    if (error) throw error
                    proofPath = data.path
                }

                // Insert Payment
                const { error } = await supabase.from('payments').insert({
                    user_id: userId,
                    loan_id: loanId,
                    amount: parseFloat(amount),
                    method: method,
                    provider: provider,
                    reference_code: reference,
                    proof_url: proofPath,
                    status: 'pending'
                })

                if (error) throw error

                toast.success("Payment Submitted for Verification!")
                router.push('/portal/payments')

            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "Failed to submit payment")
            }
        })
    }

    if (loans.length === 0) {
        return (
            <div className="text-center p-8 bg-muted rounded-lg">
                <p>You have no active loans to pay.</p>
            </div>
        )
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>
                    Submit a payment record for manual reconciliation.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="loanId">Select Loan</Label>
                        <Select onValueChange={setLoanId} defaultValue={loanId} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select loan" />
                            </SelectTrigger>
                            <SelectContent>
                                {loans.map(loan => (
                                    <SelectItem key={loan.id} value={loan.id}>
                                        Loan #{loan.id.slice(0, 6)} - Balance: Not Calculated Yet
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Paid (MWK)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="0"
                            step="0.01"
                            placeholder="e.g. 5000"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="method">Payment Method</Label>
                        <Select onValueChange={setMethod} defaultValue={method} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select methods" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                                <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="provider">Provider / Bank Name</Label>
                        <Input
                            id="provider"
                            placeholder="e.g. Airtel Money, FDH Bank"
                            required
                            value={provider}
                            onChange={(e) => setProvider(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reference">Reference / Transaction ID</Label>
                        <Input
                            id="reference"
                            placeholder="e.g. 8J29DJS29"
                            required
                            value={reference}
                            onChange={(e) => setReference(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proofFile">Proof of Payment (Screenshot)</Label>
                        <Input
                            id="proofFile"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            disabled={pending}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Payment"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
