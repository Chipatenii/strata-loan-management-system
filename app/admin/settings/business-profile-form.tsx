'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, X } from "lucide-react"
import { updateBusinessProfile } from "@/lib/actions/business-profile"
import { showErrorToast, showSuccessToast } from "@/lib/errors"

type Business = {
    id: string
    name: string
    code: string
    trading_name?: string
    email?: string
    phone?: string
    physical_address?: string
    city?: string
    country?: string
    registration_number?: string
    tax_number?: string
    website_url?: string
    logo_object_key?: string
    brand_primary_color?: string
    brand_secondary_color?: string
}

export function BusinessProfileForm({
    business,
    canEdit
}: {
    business: Business
    canEdit: boolean
}) {
    const [pending, startTransition] = useTransition()
    const [formData, setFormData] = useState({
        name: business.name || '',
        trading_name: business.trading_name || '',
        email: business.email || '',
        phone: business.phone || '',
        physical_address: business.physical_address || '',
        city: business.city || '',
        country: business.country || 'Zambia',
        registration_number: business.registration_number || '',
        tax_number: business.tax_number || '',
        website_url: business.website_url || '',
        brand_primary_color: business.brand_primary_color || '',
        brand_secondary_color: business.brand_secondary_color || ''
    })

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        startTransition(async () => {
            const result = await updateBusinessProfile({
                businessId: business.id,
                ...formData
            })

            if (result?.error) {
                showErrorToast(result.error, result.requestId)
            } else {
                showSuccessToast('Business profile updated successfully!')
            }
        })
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Identity */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Business Identity</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="name">Registered Name *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            disabled={!canEdit}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="trading_name">Trading/DBA Name</Label>
                        <Input
                            id="trading_name"
                            value={formData.trading_name}
                            onChange={(e) => handleChange('trading_name', e.target.value)}
                            disabled={!canEdit}
                            placeholder="Optional"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Business Code</Label>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-sm px-3 py-1">
                                {business.code}
                            </Badge>
                            <span className="text-xs text-muted-foreground">(Read-only)</span>
                        </div>
                    </div>
                </div>
            </div>

            <Separator />

            {/* Contact & Address */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Contact & Address</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            disabled={!canEdit}
                            placeholder="business@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                            id="phone"
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            disabled={!canEdit}
                            placeholder="+260..."
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="physical_address">Physical Address</Label>
                        <Textarea
                            id="physical_address"
                            value={formData.physical_address}
                            onChange={(e) => handleChange('physical_address', e.target.value)}
                            disabled={!canEdit}
                            rows={2}
                            placeholder="Street address, building, etc."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="city">City/Town</Label>
                        <Input
                            id="city"
                            value={formData.city}
                            onChange={(e) => handleChange('city', e.target.value)}
                            disabled={!canEdit}
                            placeholder="Lusaka"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                            id="country"
                            value={formData.country}
                            onChange={(e) => handleChange('country', e.target.value)}
                            disabled={!canEdit}
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Compliance */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Compliance & Integration</h3>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="registration_number">Registration Number</Label>
                        <Input
                            id="registration_number"
                            value={formData.registration_number}
                            onChange={(e) => handleChange('registration_number', e.target.value)}
                            disabled={!canEdit}
                            placeholder="BN12345"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="tax_number">Tax/TPN Number</Label>
                        <Input
                            id="tax_number"
                            value={formData.tax_number}
                            onChange={(e) => handleChange('tax_number', e.target.value)}
                            disabled={!canEdit}
                            placeholder="1234567890"
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="website_url">Website</Label>
                        <Input
                            id="website_url"
                            type="url"
                            value={formData.website_url}
                            onChange={(e) => handleChange('website_url', e.target.value)}
                            disabled={!canEdit}
                            placeholder="https://example.com"
                        />
                    </div>
                </div>
            </div>

            <Separator />

            {/* Branding (Optional) */}
            <div className="space-y-4">
                <h3 className="text-sm font-semibold">Branding (Optional)</h3>
                <p className="text-xs text-muted-foreground">
                    Logo upload will be available soon. For now, you can set brand colors.
                </p>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="brand_primary_color">Primary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="brand_primary_color"
                                type="color"
                                value={formData.brand_primary_color || '#3b82f6'}
                                onChange={(e) => handleChange('brand_primary_color', e.target.value)}
                                disabled={!canEdit}
                                className="w-16 h-10"
                            />
                            <Input
                                value={formData.brand_primary_color}
                                onChange={(e) => handleChange('brand_primary_color', e.target.value)}
                                disabled={!canEdit}
                                placeholder="#3b82f6"
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="brand_secondary_color">Secondary Color</Label>
                        <div className="flex gap-2">
                            <Input
                                id="brand_secondary_color"
                                type="color"
                                value={formData.brand_secondary_color || '#06b6d4'}
                                onChange={(e) => handleChange('brand_secondary_color', e.target.value)}
                                disabled={!canEdit}
                                className="w-16 h-10"
                            />
                            <Input
                                value={formData.brand_secondary_color}
                                onChange={(e) => handleChange('brand_secondary_color', e.target.value)}
                                disabled={!canEdit}
                                placeholder="#06b6d4"
                                className="flex-1 font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {canEdit && (
                <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={pending} className="gap-2">
                        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            )}
        </form>
    )
}
