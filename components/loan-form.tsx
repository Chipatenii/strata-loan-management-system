'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export function LoanApplicationForm({ userId }: { userId: string }) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    const [amount, setAmount] = useState('')
    const [duration, setDuration] = useState('1')
    const [purpose, setPurpose] = useState('')
    const [collateralDesc, setCollateralDesc] = useState('')
    const [collateralFile, setCollateralFile] = useState<File | null>(null)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            try {
                const supabase = createBrowserSupabaseClient()
                let collateralPath = null

                // Upload Collateral if present
                if (collateralFile) {
                    const timestamp = Date.now()
                    const { data, error } = await supabase.storage
                        .from('collateral')
                        .upload(`${userId}/${timestamp}_${collateralFile.name}`, collateralFile)
                    if (error) throw error
                    collateralPath = data.path
                }

                // Insert Loan
                const { error } = await supabase.from('loans').insert({
                    user_id: userId,
                    amount: parseFloat(amount),
                    duration_months: parseInt(duration),
                    interest_rate: 15.0, // Fixed 15% for pilot
                    purpose: purpose,
                    collateral_description: collateralDesc,
                    collateral_image_url: collateralPath,
                    status: 'pending'
                })

                if (error) throw error

                toast.success("Loan Application Submitted!")
                router.push('/portal/loans')

            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "Failed to submit loan application")
            }
        })
    }

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>Request a Loan</CardTitle>
                <CardDescription>
                    Apply for a new loan. Interest rate is fixed at 15% per month.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (MWK)</Label>
                        <Input
                            id="amount"
                            type="number"
                            min="1000"
                            step="500"
                            placeholder="e.g. 50000"
                            required
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="duration">Duration (Months)</Label>
                        <Select onValueChange={setDuration} defaultValue={duration} disabled={pending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Month</SelectItem>
                                <SelectItem value="2">2 Months</SelectItem>
                                <SelectItem value="3">3 Months</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Textarea
                            id="purpose"
                            placeholder="Short description of why you need this loan."
                            required
                            value={purpose}
                            onChange={(e) => setPurpose(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="collateral">Collateral Description (Optional)</Label>
                        <Input
                            id="collateral"
                            placeholder="e.g. Laptop, Phone, Fridge"
                            value={collateralDesc}
                            onChange={(e) => setCollateralDesc(e.target.value)}
                            disabled={pending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="collateralFile">Collateral Photo (Optional)</Label>
                        <Input
                            id="collateralFile"
                            type="file"
                            accept="image/*"
                            onChange={(e) => setCollateralFile(e.target.files?.[0] || null)}
                            disabled={pending}
                        />
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
