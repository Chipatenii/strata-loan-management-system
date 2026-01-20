'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { Loader2, ChevronRight, ChevronLeft, UploadCloud } from "lucide-react"
import { useRouter } from "next/navigation"

export function KycForm({ userId, businessId }: { userId: string, businessId: string }) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    const [step, setStep] = useState(1)

    // State for all fields
    const [formData, setFormData] = useState({
        // Personal
        dob: '',
        nrc_passport_number: '',
        gender: '',
        marital_status: '',
        residential_address: '',
        city_town: '',
        // Employment
        employment_status: 'employed',
        employer_name: '',
        job_title: '',
        monthly_income: '',
        pay_day: '',
        // Banking
        bank_name: '',
        account_number: '',
        // Next of Kin
        nok_full_name: '',
        nok_relationship: '',
        nok_phone: '',
        nok_address: ''
    })

    // Files state
    const [idFile, setIdFile] = useState<File | null>(null)
    const [payslipFile, setPayslipFile] = useState<File | null>(null)
    const [bankStatementFile, setBankStatementFile] = useState<File | null>(null)
    const [proofFile, setProofFile] = useState<File | null>(null)

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const nextStep = () => setStep(s => s + 1)
    const prevStep = () => setStep(s => s - 1)

    const handleUpload = async (bucket: string, file: File, path: string) => {
        const supabase = createBrowserSupabaseClient()
        const { data, error } = await supabase.storage
            .from(bucket)
            .upload(path, file, { upsert: true })

        if (error) throw error
        return data.path
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!idFile || !payslipFile || !bankStatementFile || !proofFile) {
            toast.error("Please upload all required documents.")
            return
        }

        startTransition(async () => {
            try {
                const supabase = createBrowserSupabaseClient()
                const timestamp = Date.now()

                toast.info("Uploading documents...")

                const idPath = await handleUpload('kyc-docs', idFile, `${userId}/id_${timestamp}_${idFile.name}`)
                const payslipPath = await handleUpload('kyc-docs', payslipFile, `${userId}/payslip_${timestamp}_${payslipFile.name}`)
                const bankPath = await handleUpload('kyc-docs', bankStatementFile, `${userId}/bank_${timestamp}_${bankStatementFile.name}`)
                const proofPath = await handleUpload('kyc-docs', proofFile, `${userId}/proof_${timestamp}_${proofFile.name}`)

                // Insert KYC Record with all new fields
                const { error } = await supabase.from('kyc_records').insert({
                    user_id: userId,
                    business_id: businessId,
                    status: 'pending_review',

                    // Documents
                    id_document_url: idPath,
                    payslip_url: payslipPath,
                    bank_statement_url: bankPath,
                    proof_of_address_url: proofPath,

                    // Structured Data
                    dob: formData.dob || null,
                    nrc_passport_number: formData.nrc_passport_number,
                    gender: formData.gender,
                    marital_status: formData.marital_status,
                    residential_address: formData.residential_address,
                    city_town: formData.city_town,

                    employment_status: formData.employment_status,
                    employer_name: formData.employer_name,
                    job_title: formData.job_title,
                    monthly_income: formData.monthly_income ? parseFloat(formData.monthly_income) : null,
                    pay_day: formData.pay_day,

                    bank_name: formData.bank_name,
                    account_number: formData.account_number,

                    nok_full_name: formData.nok_full_name,
                    nok_relationship: formData.nok_relationship,
                    nok_phone: formData.nok_phone,
                    nok_address: formData.nok_address,

                    data: { uploaded_at: new Date().toISOString() }
                })

                if (error) throw error

                toast.success("KYC Submitted successfully!")
                router.refresh()
                router.push('/portal')

            } catch (error: any) {
                console.error(error)
                toast.error(error.message || "Failed to submit KYC")
            }
        })
    }

    // Step 1: Personal & Contact
    if (step === 1) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Personal Details (1/4)</CardTitle>
                    <CardDescription>Let's start with your basic information.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>NRC / Passport Number</Label>
                            <Input value={formData.nrc_passport_number} onChange={e => handleChange('nrc_passport_number', e.target.value)} placeholder="e.g. 123456/10/1" />
                        </div>
                        <div className="space-y-2">
                            <Label>Date of Birth</Label>
                            <Input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Gender</Label>
                            <Select value={formData.gender} onValueChange={v => handleChange('gender', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="male">Male</SelectItem>
                                    <SelectItem value="female">Female</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Marital Status</Label>
                            <Select value={formData.marital_status} onValueChange={v => handleChange('marital_status', v)}>
                                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="single">Single</SelectItem>
                                    <SelectItem value="married">Married</SelectItem>
                                    <SelectItem value="divorced">Divorced</SelectItem>
                                    <SelectItem value="widowed">Widowed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Residential Address</Label>
                        <Input value={formData.residential_address} onChange={e => handleChange('residential_address', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>City / Town</Label>
                        <Input value={formData.city_town} onChange={e => handleChange('city_town', e.target.value)} />
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                    <Button onClick={nextStep} disabled={!formData.nrc_passport_number || !formData.residential_address}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Step 2: Employment
    if (step === 2) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Employment & Income (2/4)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label>Employment Status</Label>
                        <Select value={formData.employment_status} onValueChange={v => handleChange('employment_status', v)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="employed">Employed</SelectItem>
                                <SelectItem value="self_employed">Self Employed</SelectItem>
                                <SelectItem value="unemployed">Unemployed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {formData.employment_status !== 'unemployed' && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Employer / Business Name</Label>
                                    <Input value={formData.employer_name} onChange={e => handleChange('employer_name', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Job Title</Label>
                                    <Input value={formData.job_title} onChange={e => handleChange('job_title', e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Monthly Income</Label>
                                    <Input type="number" value={formData.monthly_income} onChange={e => handleChange('monthly_income', e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Pay Day</Label>
                                    <Input value={formData.pay_day} onChange={e => handleChange('pay_day', e.target.value)} placeholder="e.g. 25th" />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button onClick={nextStep} disabled={formData.employment_status !== 'unemployed' && (!formData.monthly_income || !formData.employer_name)}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Step 3: Banking & NOK
    if (step === 3) {
        return (
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Banking & Next of Kin (3/4)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-sm border-b pb-2">Banking Details (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Bank Name</Label>
                                <Input value={formData.bank_name} onChange={e => handleChange('bank_name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Account Number</Label>
                                <Input value={formData.account_number} onChange={e => handleChange('account_number', e.target.value)} />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-sm border-b pb-2">Next of Kin (Required)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Full Name</Label>
                                <Input value={formData.nok_full_name} onChange={e => handleChange('nok_full_name', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Relationship</Label>
                                <Input value={formData.nok_relationship} onChange={e => handleChange('nok_relationship', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Phone Number</Label>
                                <Input value={formData.nok_phone} onChange={e => handleChange('nok_phone', e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Physical Address</Label>
                                <Input value={formData.nok_address} onChange={e => handleChange('nok_address', e.target.value)} />
                            </div>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={prevStep}>Back</Button>
                    <Button onClick={nextStep} disabled={!formData.nok_full_name || !formData.nok_phone}>
                        Next <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                </CardFooter>
            </Card>
        )
    }

    // Step 4: Documents
    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>Document Upload (4/4)</CardTitle>
                <CardDescription>
                    Please upload clear copies of the following documents.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="id_doc">National ID / Passport</Label>
                    <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                        <Input
                            id="id_doc"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,.pdf"
                            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{idFile ? idFile.name : "Click to Upload ID"}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="payslip_doc">Payslip (Most Recent)</Label>
                    <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                        <Input
                            id="payslip_doc"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,.pdf"
                            onChange={(e) => setPayslipFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{payslipFile ? payslipFile.name : "Click to Upload Payslip"}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="bank_doc">Bank Statements (3 Months)</Label>
                    <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                        <Input
                            id="bank_doc"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,.pdf"
                            onChange={(e) => setBankStatementFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{bankStatementFile ? bankStatementFile.name : "Click to Upload Bank Statement"}</span>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="proof_doc">Proof of Address</Label>
                    <div className="border border-dashed rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors relative">
                        <Input
                            id="proof_doc"
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            accept="image/*,.pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <div className="flex flex-col items-center gap-2">
                            <UploadCloud className="h-8 w-8 text-muted-foreground" />
                            <span className="text-sm font-medium">{proofFile ? proofFile.name : "Click to Upload Proof of Address"}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={prevStep} disabled={pending}>Back</Button>
                <Button onClick={handleSubmit} disabled={pending || !idFile || !payslipFile || !bankStatementFile || !proofFile}>
                    {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit for Review"}
                </Button>
            </CardFooter>
        </Card>
    )
}
