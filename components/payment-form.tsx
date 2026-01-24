'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatCurrency } from "@/lib/utils"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Smartphone, Building2 } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function PaymentForm({
    userId,
    businessId,
    loans,
    paymentConfig,
    instructionText
}: {
    userId: string,
    businessId: string,
    loans: any[],
    paymentConfig?: any,
    instructionText?: string
}) {
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
                    business_id: businessId,
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

                // Clear form
                setAmount('')
                setReference('')
                setProvider('')
                setProofFile(null)

                // Refresh data to show pending status or updated balance if immediately handled
                router.refresh()
                // If we want to stay on the same page but ensure RSC reloads:
                // router.push('/portal/payments') // existing
                // But refresh() is more explicit for RSC updates.

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
        <Card className="w-full max-w-lg shadow-sm sm:shadow-md mx-auto">
            <CardHeader>
                <CardTitle>Make a Payment</CardTitle>
                <CardDescription>
                    Submit a payment record for manual reconciliation.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    {/* General Business Payment Instructions */}
                    {instructionText ? (
                        <div className="bg-primary/5 rounded-lg border-2 border-primary/20 p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                <h3 className="font-bold text-primary">How to Pay</h3>
                            </div>
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {instructionText}
                            </p>
                        </div>
                    ) : (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Warning</AlertTitle>
                            <AlertDescription>
                                No payment instructions found for this organization. Please contact support.
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Method-specific Instructions (Legacy or Additive) */}
                    {method === 'mobile_money' && paymentConfig?.mobile_money_instructions && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <Smartphone className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Mobile Money Instructions</AlertTitle>
                            <AlertDescription className="text-blue-700 whitespace-pre-wrap text-xs mt-1">
                                {paymentConfig.mobile_money_instructions}
                            </AlertDescription>
                        </Alert>
                    )}
                    {method === 'bank_transfer' && paymentConfig?.bank_transfer_instructions && (
                        <Alert className="bg-blue-50 border-blue-200">
                            <Building2 className="h-4 w-4 text-blue-600" />
                            <AlertTitle className="text-blue-800">Bank Transfer Instructions</AlertTitle>
                            <AlertDescription className="text-blue-700 whitespace-pre-wrap text-xs mt-1">
                                {paymentConfig.bank_transfer_instructions}
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="loanId">Select Loan</Label>
                        <Select onValueChange={setLoanId} defaultValue={loanId} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select loan" />
                            </SelectTrigger>
                            <SelectContent>
                                {loans.map(loan => (
                                    <SelectItem key={loan.id} value={loan.id}>
                                        <div className="flex flex-col">
                                            <span>Loan #{loan.id.slice(0, 6)}</span>
                                            <span className="text-[10px] opacity-70">
                                                Paid: {formatCurrency(loan.totalPaid || 0)} | Balance: {formatCurrency(loan.balance || 0)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount Paid (ZMW)</Label>
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
