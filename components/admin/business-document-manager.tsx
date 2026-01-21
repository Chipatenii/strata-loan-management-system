'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, FileText, CheckCircle, XCircle, Clock } from "lucide-react"
import { createBrowserSupabaseClient } from "@/lib/supabase-client"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface BusinessDocument {
    id: string
    document_type: string
    file_url: string
    status: string
    uploaded_at: string
}

interface BusinessDocumentManagerProps {
    businessId: string
    documents: BusinessDocument[]
}

export function BusinessDocumentManager({ businessId, documents }: BusinessDocumentManagerProps) {
    const [isUploading, startTransition] = useTransition()
    const [uploadingFile, setUploadingFile] = useState(false)
    const [selectedType, setSelectedType] = useState<string>('')
    const router = useRouter()
    const supabase = createBrowserSupabaseClient()

    const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const fileInput = (e.currentTarget.elements.namedItem('file') as HTMLInputElement)
        const file = fileInput.files?.[0]

        if (!file || !selectedType) {
            toast.error("Please select a document type and file")
            return
        }

        setUploadingFile(true)
        startTransition(async () => {
            try {
                const fileExt = file.name.split('.').pop()
                const fileName = `${businessId}/${Date.now()}.${fileExt}`

                // 1. Upload to Storage
                const { error: uploadError } = await supabase.storage
                    .from('business-docs')
                    .upload(fileName, file)

                if (uploadError) throw uploadError

                // 2. Insert Record
                const { error: dbError } = await supabase
                    .from('business_documents')
                    .insert({
                        business_id: businessId,
                        document_type: selectedType,
                        file_url: fileName,
                        status: 'pending'
                    })

                if (dbError) throw dbError

                toast.success("Document uploaded successfully")
                fileInput.value = ''
                setSelectedType('')
                router.refresh()
            } catch (error: any) {
                toast.error(error.message || "Failed to upload document")
            } finally {
                setUploadingFile(false)
            }
        })
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'verified':
                return <Badge className="bg-green-600 hover:bg-green-700"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge>
            case 'rejected':
                return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" /> Rejected</Badge>
            default:
                return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" /> Pending</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Document Type</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Uploaded</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                    No documents uploaded yet.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => (
                                <TableRow key={doc.id}>
                                    <TableCell className="font-medium capitalize">
                                        {doc.document_type.replace('_', ' ')}
                                    </TableCell>
                                    <TableCell>{getStatusBadge(doc.status)}</TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {new Date(doc.uploaded_at).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <a
                                            href={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/business-docs/${doc.file_url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-primary hover:underline text-sm"
                                        >
                                            View
                                        </a>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="p-4 border rounded-md bg-muted/20">
                <h3 className="font-semibold mb-4 text-sm">Upload New Document</h3>
                <form onSubmit={handleUpload} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="type">Document Type</Label>
                            <Select value={selectedType} onValueChange={setSelectedType}>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="registration_cert">Registration Certificate</SelectItem>
                                    <SelectItem value="tax_id">Tax ID / PIN</SelectItem>
                                    <SelectItem value="trading_license">Trading License</SelectItem>
                                    <SelectItem value="other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="file">File</Label>
                            <Input id="file" name="file" type="file" accept=".pdf,.png,.jpg,.jpeg" disabled={uploadingFile} />
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" disabled={!selectedType || uploadingFile}>
                            {uploadingFile ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                                </>
                            ) : (
                                <>
                                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    )
}
