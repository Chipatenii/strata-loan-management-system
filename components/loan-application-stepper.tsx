'use client'

import { LOAN_STATUS } from "@/lib/constants"
import { calculateSimpleInterest } from "@/lib/domain/finance"

import { useState, useTransition, useMemo, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { showErrorToast, showSuccessToast } from "@/lib/errors"
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Building2, UploadCloud, X } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { submitLoanApplication } from "@/lib/actions/loans"

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

const DISBURSEMENT_METHODS = [
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_transfer', label: 'Bank Transfer' }
]

export function LoanApplicationStepper({ userId, businessId, products, kycStatus }: {
    userId: string,
    businessId: string,
    products: Product[],
    kycStatus: string
}) {
    const [pending, startTransition] = useTransition()
    const [step, setStep] = useState(1)

    // Form State
    const [selectedProductId, setSelectedProductId] = useState<string>('')
    const [amount, setAmount] = useState('')
    const [selectedRateId, setSelectedRateId] = useState<string>('')
    const [purpose, setPurpose] = useState('')

    // Collateral (Multi-image)
    const [collateralDesc, setCollateralDesc] = useState('')
    const [collateralFiles, setCollateralFiles] = useState<File[]>([])

    // Disbursement
    const [disbursementMethod, setDisbursementMethod] = useState<string>('mobile_money')
    const [mobileNetwork, setMobileNetwork] = useState('')
    const [mobileNumber, setMobileNumber] = useState('')
    const [bankName, setBankName] = useState('')
    const [accountName, setAccountName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')

    // Derived Data
    const selectedProduct = useMemo(() => products.find(p => p.id === selectedProductId), [products, selectedProductId])
    const selectedRate = useMemo(() => selectedProduct?.loan_product_rates.find(r => r.id === selectedRateId), [selectedProduct, selectedRateId])

    // Repayment Preview
    const repaymentPreview = useMemo(() => {
        if (!amount || !selectedRate) return null
        const principal = parseFloat(amount)
        const duration = selectedRate.duration_unit === 'month' ? selectedRate.duration_value : selectedRate.duration_value / 4

        return calculateSimpleInterest(principal, selectedRate.interest_rate, duration)
    }, [amount, selectedRate])

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setCollateralFiles(prev => [...prev, ...Array.from(e.target.files || [])])
        }
    }

    const removeFile = (index: number) => {
        setCollateralFiles(prev => prev.filter((_, i) => i !== index))
    }

    /**
     * Convert File to base64 for server action
     */
    const fileToBase64 = (file: File): Promise<{ name: string; type: string; base64: string }> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
                const base64 = (reader.result as string).split(',')[1]
                resolve({
                    name: file.name,
                    type: file.type,
                    base64
                })
            }
            reader.onerror = reject
            reader.readAsDataURL(file)
        })
    }

    const handleSubmit = async () => {
        if (!selectedProduct || !selectedRate || !repaymentPreview) return

        startTransition(async () => {
            try {
                // Convert collateral images to base64
                let collateralImages: Array<{ name: string; type: string; base64: string }> = []
                if (collateralFiles.length > 0) {
                    collateralImages = await Promise.all(collateralFiles.map(fileToBase64))
                }

                // Submit to server action
                const result = await submitLoanApplication({
                    userId,
                    businessId,
                    productId: selectedProductId,
                    rateId: selectedRateId,
                    amount,
                    purpose,
                    employmentStatus: 'employed', // You may want to add this to form
                    monthlyIncome: '0', // You may want to add this to form
                    collateralType: collateralDesc,
                    collateralValue: amount, // Using loan amount as collateral value
                    collateralDescription: collateralDesc,
                    collateralImages: collateralImages.length > 0 ? collateralImages : undefined
                })

                if (result?.error) {
                    showErrorToast(result.error, result.requestId)
                } else {
                    showSuccessToast("Application submitted successfully!")
                    // Redirect happens in server action
                }
            } catch (error: any) {
                showErrorToast(error.message || "Failed to submit application")
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
                                {product.min_amount && <Badge variant="outline">Min: {product.min_amount ? formatCurrency(product.min_amount) : 'N/A'}</Badge>}
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
    // Step 2: Configure Details
    if (step === 2) {
        return (
            <div className="grid gap-6 md:grid-cols-2 max-w-4xl w-full">
                <Card className="w-full">
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
                            <Label htmlFor="amount">Amount (ZMW)</Label>
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                min={selectedProduct?.min_amount || 0}
                                max={selectedProduct?.max_amount || undefined}
                            />
                            {selectedProduct?.min_amount && <span className="text-xs text-muted-foreground">Min: {formatCurrency(selectedProduct.min_amount)}</span>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="purpose">Purpose</Label>
                            <Textarea id="purpose" value={purpose} onChange={e => setPurpose(e.target.value)} />
                        </div>

                        {selectedProduct?.requires_collateral && (
                            <div className="space-y-4 border p-4 rounded-lg bg-muted/20">
                                <h4 className="font-semibold text-sm">Collateral (Min 4 Photos Required)</h4>
                                <div className="space-y-2">
                                    <Label>Description</Label>
                                    <Input value={collateralDesc} onChange={e => setCollateralDesc(e.target.value)} placeholder="e.g. 2015 Toyota Corolla" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Photos ({collateralFiles.length}/4)</Label>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        {collateralFiles.map((file, idx) => (
                                            <div key={idx} className="relative group border rounded p-2 text-xs flex items-center justify-between bg-background">
                                                <span className="truncate max-w-[80%]">{file.name}</span>
                                                <button onClick={() => removeFile(idx)} className="text-destructive hover:bg-destructive/10 rounded p-1">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileSelect}
                                            className="cursor-pointer"
                                        />
                                    </div>
                                    {collateralFiles.length < 4 && (
                                        <p className="text-xs text-destructive font-medium">Please upload at least 4 photos.</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    {/* Repayment Preview */}
                    <Card className="bg-primary/5 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg text-primary">Repayment Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Principal</span>
                                <span className="font-medium">{amount ? formatCurrency(parseFloat(amount)) : '-'}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Interest ({selectedRate?.interest_rate || 0}%)</span>
                                <span className="font-medium text-destructive">
                                    {repaymentPreview ? `+ ${formatCurrency(repaymentPreview.interest)}` : '-'}
                                </span>
                            </div>
                            <div className="pt-2 border-t flex justify-between font-bold text-lg">
                                <span>Total Repayment</span>
                                <span>{repaymentPreview ? formatCurrency(repaymentPreview.total) : '-'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Disbursement Details */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base">Disbursement Method</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Select value={disbursementMethod} onValueChange={setDisbursementMethod}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISBURSEMENT_METHODS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
                                </SelectContent>
                            </Select>

                            {disbursementMethod === 'mobile_money' && (
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="space-y-2">
                                        <Label>Network</Label>
                                        <Select value={mobileNetwork} onValueChange={setMobileNetwork}>
                                            <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="mtn">MTN</SelectItem>
                                                <SelectItem value="airtel">Airtel</SelectItem>
                                                <SelectItem value="zamtel">Zamtel</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Number</Label>
                                        <Input value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} placeholder="09..." />
                                    </div>
                                </div>
                            )}

                            {disbursementMethod === 'bank_transfer' && (
                                <div className="space-y-3">
                                    <div className="space-y-2">
                                        <Label>Bank Name</Label>
                                        <Input value={bankName} onChange={e => setBankName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Name</Label>
                                        <Input value={accountName} onChange={e => setAccountName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Account Number</Label>
                                        <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={prevStep}>Back</Button>
                        <Button onClick={nextStep}
                            disabled={!amount || !selectedRateId ||
                                (selectedProduct?.requires_collateral && (!collateralDesc || collateralFiles.length < 4)) ||
                                (disbursementMethod === 'mobile_money' && (!mobileNetwork || !mobileNumber)) ||
                                (disbursementMethod === 'bank_transfer' && (!bankName || !accountNumber))
                            }>
                            Review & Submit <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </div>
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
                        <div className="flex justify-between"><span>Amount:</span> <span className="font-semibold">{formatCurrency(parseFloat(amount))}</span></div>
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
