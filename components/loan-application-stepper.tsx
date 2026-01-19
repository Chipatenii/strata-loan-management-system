'use client'

import { useState, useTransition, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

type Product = {
    id: string
    name: string
    description: string
    min_amount: number | null
    max_amount: number | null
    requires_collateral: boolean
    requires_kyc: boolean
    loan_product_rates: {
        id: string
        duration_unit: 'month' | 'week'
        duration_value: number
        interest_rate: number
    }[]
}

export function LoanApplicationStepper({ userId, businessId, products, kycStatus }: {
    userId: string,
    businessId: string,
    products: Product[],
    kycStatus: string
}) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()
    const [step, setStep] = useState(1)

    // Form State
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [amount, setAmount] = useState('')
    const [selectedRateId, setSelectedRateId] = useState<string>('')
    const [purpose, setPurpose] = useState('')
    const [collateralDesc, setCollateralDesc] = useState('')
    const [collateralFile, setCollateralFile] = useState<File | null>(null)

    // Derived Data
    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId])
    const selectedRate = useMemo(() => selectedProduct?.loan_product_rates.find(r => r.id === selectedRateId), [selectedProduct, selectedRateId])

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    const handleSubmit = async () => {
        if (!selectedProduct || !selectedRate) return

        startTransition(async () => {
            try {
                const supabase = createBrowserSupabaseClient()

                // 1. Upload Collateral if present
                let collateralPath = null
                if (collateralFile) {
                    const timestamp = Date.now()
                    const { data, error } = await supabase.storage
                        .from('collateral')
                        .upload(`${userId}/${timestamp}_${collateralFile.name}`, collateralFile)
                    if (error) throw error
                    collateralPath = data.path
                }

                // 2. Insert Loan
                const { error } = await supabase.from('loans').insert({
                    user_id: userId,
                    business_id: businessId,
                    product_id: selectedProductId,
                    amount: parseFloat(amount),
                    // Store duration in months (approximate if weeks for now, or just store raw)
                    // Schema checks 'duration_months', so we might need backward capability or update schema.
                    // For now, let's assume month based mostly, or convert weeks to fractional months?
                    // Or better: Update schema to support 'duration_unit'. 
                    // To be safe/non-breaking: if unit is week, duration_months = weeks / 4.
                    duration_months: selectedRate.duration_unit === 'month' ? selectedRate.duration_value : Math.ceil(selectedRate.duration_value / 4),
                    interest_rate: selectedRate.interest_rate,
                    applied_rate: selectedRate.interest_rate,
                    purpose: purpose,
                    collateral_description: collateralDesc,
                    collateral_image_url: collateralPath,
                    status: 'pending'
                })

                if (error) throw error

                toast.success("Application Submitted Successfully!")
                router.push('/portal/loans')

            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "Failed to submit application")
            }
        })
    }

    // Step 1: Select Product
    if (step === 1) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Select a Loan Product</CardTitle>
                    <CardDescription>Choose the type of loan that suits your needs.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-2">
                    {products.map(product => (
                        <div
                            key={product.id}
                            onClick={() => setSelectedProductId(product.id)}
                            className={`cursor-pointer border rounded-lg p-4 hover:bg-muted/50 transition-colors ${selectedProductId === product.id ? 'border-primary ring-1 ring-primary bg-muted/20' : ''}`}
                        >
                            <div className="font-semibold">{product.name}</div>
                            <div className="text-sm text-muted-foreground mt-1 mb-2">{product.description || 'No description'}</div>
                            <div className="flex gap-2 text-xs">
                                {product.min_amount && <Badge variant="outline">Min: {product.min_amount.toLocaleString()}</Badge>}
                                {product.requires_collateral && <Badge variant="destructive">Collateral</Badge>}
                            </div>
                        </div>
                    ))}
                    {products.length === 0 && (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                            No active loan products available from this business.
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    <Button onClick={nextStep} disabled={!selectedProductId} className="w-full">
                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Step 2: Configure Details
    if (step === 2) {
        return (
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Configure Loan</CardTitle>
                    <CardDescription>{selectedProduct?.name}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Select Duration & Rate</Label>
                        <Select value={selectedRateId} onValueChange={setSelectedRateId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Choose duration" />
                            </SelectTrigger>
                            <SelectContent>
                                {selectedProduct?.loan_product_rates.map(rate => (
                                    <SelectItem key={rate.id} value={rate.id}>
                                        {rate.duration_value} {rate.duration_unit}(s) — {rate.interest_rate}% Interest
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (MWK)</Label>
                        <Input
                            id="amount"
                            type="number"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            min={selectedProduct?.min_amount || 0}
                            max={selectedProduct?.max_amount || undefined}
                        />
                        {selectedProduct?.min_amount && <span className="text-xs text-muted-foreground">Min: {selectedProduct.min_amount.toLocaleString()}</span>}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="purpose">Purpose</Label>
                        <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} />
                    </div>

                    {selectedProduct?.requires_collateral && (
                        <>
                            <div className="space-y-2">
                                <Label>Collateral Description</Label>
                                <Input value={collateralDesc} onChange={e => setCollateralDesc(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Collateral Photo</Label>
                                <Input type="file" onChange={e => setCollateralFile(e.target.files?.[0] || null)} />
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button onClick={nextStep} disabled={!amount || !selectedRateId || (selectedProduct?.requires_collateral && !collateralDesc)}>
                        Continue <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Step 3: Review & KYC Check
    if (step === 3) {
        // Logic: If product requires KYC and user not approved, block or prompt
        const needsKyc = selectedProduct?.requires_kyc && kycStatus !== 'approved'

        return (
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Review & Submit</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
                        <div className="flex justify-between"><span>Product:</span> <span className="font-semibold">{selectedProduct?.name}</span></div>
                        <div className="flex justify-between"><span>Amount:</span> <span className="font-semibold">MWK {parseFloat(amount).toLocaleString()}</span></div>
                        <div className="flex justify-between"><span>Duration:</span> <span className="font-semibold">{selectedRate?.duration_value} {selectedRate?.duration_unit}(s)</span></div>
                        <div className="flex justify-between"><span>Interest:</span> <span className="font-semibold">{selectedRate?.interest_rate}%</span></div>
                    </div>

                    {needsKyc && (
                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-yellow-800 text-sm flex gap-3">
                            <Building2 className="h-5 w-5 shrink-0" />
                            <div>
                                <p className="font-semibold">KYC Verification Required</p>
                                <p>You must complete your profile verification before this loan can be disbursed. You can submit now, but it will be pending KYC.</p>
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep} disabled={pending}>Back</Button>
                    <Button onClick={handleSubmit} disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit Application"}
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    return null
}
