'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useTransition, useState } from "react"
import { createLoanProduct, createProductRate, deleteProductRate } from "@/lib/actions/products"
import { toast } from "sonner"
import { Loader2, Trash2, Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function ProductForm({ businessId, product }: { businessId: string, product?: any }) {
    const router = useRouter()
    const [pending, startTransition] = useTransition()

    // Product State
    const [formData, setFormData] = useState({
        name: product?.name || '',
        description: product?.description || '',
        min_amount: product?.min_amount || '',
        max_amount: product?.max_amount || '',
        requires_collateral: product?.requires_collateral || false,
        requires_kyc: product?.requires_kyc || true,
        is_active: product?.is_active ?? true,
    })

    // Rates State (Only for existing products to add/remove)
    // For new products, we might want to create product first then add rates, or do it all in one go.
    // Simplifying: Create Product First, Then Manage Rates in "Edit" mode.
    const isEditing = !!product

    // Add Rate State
    const [newRate, setNewRate] = useState({
        duration_unit: 'month',
        duration_value: '1',
        interest_rate: '15'
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const val = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value
        setFormData(prev => ({ ...prev, [e.target.id]: val }))
    }

    const handleSwitchChange = (id: string, checked: boolean) => {
        setFormData(prev => ({ ...prev, [id]: checked }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        startTransition(async () => {
            // TODO: Handle Update if isEditing
            if (!isEditing) {
                const result = await createLoanProduct(formData as any, businessId)
                if (result.error) {
                    toast.error(result.error)
                } else {
                    toast.success("Product created")
                    router.push('/admin/products')
                }
            } else {
                // Update logic here (omitted for brevity in this step, focusing on creation first)
                toast.info("Update logic implemented in next step if needed")
            }
        })
    }

    const handleAddRate = async () => {
        if (!product) return

        startTransition(async () => {
            const result = await createProductRate({
                product_id: product.id,
                duration_unit: newRate.duration_unit as 'month' | 'week',
                duration_value: parseInt(newRate.duration_value),
                interest_rate: parseFloat(newRate.interest_rate)
            })

            if (result.error) toast.error(result.error)
            else {
                toast.success("Rate added")
                router.refresh()
            }
        })
    }

    const handleDeleteRate = async (rateId: string) => {
        startTransition(async () => {
            const result = await deleteProductRate(rateId)
            if (result.error) toast.error(result.error)
            else {
                toast.success("Rate deleted")
                router.refresh()
            }
        })
    }

    return (
        <div className="space-y-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Basic Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Product Name</Label>
                            <Input id="name" required value={formData.name} onChange={handleChange} disabled={pending} placeholder="e.g. Payday Loan" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" value={formData.description} onChange={handleChange} disabled={pending} placeholder="Short description for customers" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="min_amount">Min Amount (MWK)</Label>
                                <Input id="min_amount" type="number" value={formData.min_amount} onChange={handleChange} disabled={pending} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="max_amount">Max Amount (MWK)</Label>
                                <Input id="max_amount" type="number" value={formData.max_amount} onChange={handleChange} disabled={pending} />
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Switch id="requires_collateral" checked={formData.requires_collateral} onCheckedChange={(c) => handleSwitchChange('requires_collateral', c)} disabled={pending} />
                                <Label htmlFor="requires_collateral">Requires Collateral</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Switch id="is_active" checked={formData.is_active} onCheckedChange={(c) => handleSwitchChange('is_active', c)} disabled={pending} />
                                <Label htmlFor="is_active">Active</Label>
                            </div>
                        </div>

                        {!isEditing && (
                            <Button type="submit" disabled={pending}>
                                {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Create Product"}
                            </Button>
                        )}
                        {isEditing && (
                            <div className="flex justify-end">
                                <Button type="submit" disabled={pending}>Save Changes</Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </form>

            {isEditing && (
                <Card>
                    <CardHeader>
                        <CardTitle>Interest Rates & Durations</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* List Existing Rates */}
                        <div className="space-y-2">
                            {product.loan_product_rates?.map((rate: any) => (
                                <div key={rate.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                    <span className="font-medium">
                                        {rate.duration_value} {rate.duration_unit}(s) at {rate.interest_rate}% Interest
                                    </span>
                                    <Button size="sm" variant="ghost" onClick={() => handleDeleteRate(rate.id)} disabled={pending}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <Separator />

                        {/* Add New Rate Form */}
                        <div className="grid grid-cols-4 gap-4 items-end">
                            <div className="grid gap-2">
                                <Label>Duration Value</Label>
                                <Input type="number" value={newRate.duration_value} onChange={(e) => setNewRate({ ...newRate, duration_value: e.target.value })} disabled={pending} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Unit</Label>
                                <Select value={newRate.duration_unit} onValueChange={(v) => setNewRate({ ...newRate, duration_unit: v })}>
                                    <SelectTrigger disabled={pending}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="week">Week(s)</SelectItem>
                                        <SelectItem value="month">Month(s)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label>Interest Rate (%)</Label>
                                <Input type="number" step="0.1" value={newRate.interest_rate} onChange={(e) => setNewRate({ ...newRate, interest_rate: e.target.value })} disabled={pending} />
                            </div>
                            <Button onClick={handleAddRate} disabled={pending} variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Add Rate
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
