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

export function KycForm({ userId, businessId }: { userId: string, businessId: string }) {
    const [pending, startTransition] = useTransition()
    const router = useRouter()
    // Files state
    const [idFile, setIdFile] = useState<File | null>(null)
    const [payslipFile, setPayslipFile] = useState<File | null>(null)
    const [bankStatementFile, setBankStatementFile] = useState<File | null>(null)
    const [proofFile, setProofFile] = useState<File | null>(null)

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

                // Parallel uploads if possible, but sequential is safer for error handling in this context
                const idPath = await handleUpload('kyc-docs', idFile, `${userId}/id_${timestamp}_${idFile.name}`)
                const payslipPath = await handleUpload('kyc-docs', payslipFile, `${userId}/payslip_${timestamp}_${payslipFile.name}`)
                const bankPath = await handleUpload('kyc-docs', bankStatementFile, `${userId}/bank_${timestamp}_${bankStatementFile.name}`)
                const proofPath = await handleUpload('kyc-docs', proofFile, `${userId}/proof_${timestamp}_${proofFile.name}`)

                // 2. Insert KYC Record
                const { error } = await supabase.from('kyc_records').insert({
                    user_id: userId,
                    business_id: businessId,
                    status: 'pending_review',
                    id_document_url: idPath,
                    payslip_url: payslipPath,
                    bank_statement_url: bankPath,
                    proof_of_address_url: proofPath,
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

    return (
        <Card className="w-full max-w-2xl">
            <CardHeader>
                <CardTitle>KYC Submission</CardTitle>
                <CardDescription>
                    Verify your identity to access loans. Please upload all required documents.
                </CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="id_doc">National ID / Passport</Label>
                        <Input
                            id="id_doc"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setIdFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Upload a clear photo or scan.</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="payslip_doc">Payslip (Most Recent)</Label>
                        <Input
                            id="payslip_doc"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setPayslipFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="bank_doc">Bank Statements (3 Months)</Label>
                        <Input
                            id="bank_doc"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setBankStatementFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="proof_doc">Proof of Address</Label>
                        <Input
                            id="proof_doc"
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                            disabled={pending}
                            required
                        />
                        <p className="text-xs text-muted-foreground">Utility bill or lease agreement.</p>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button className="w-full" type="submit" disabled={pending}>
                        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Submit for Review"}
                    </Button>
                </CardFooter>
            </form>
        </Card>
    )
}
