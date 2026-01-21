import { createClient } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin, FileText, Settings } from "lucide-react"
import { BusinessProfileForm } from "./business-profile-form"
import { PaymentSettingsForm } from "./form"

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return <div>Not authenticated</div>

    // Fetch user profile and business
    const { data: profile } = await supabase
        .from('users')
        .select('business_id, role')
        .eq('id', user.id)
        .single()

    const { data: business } = await supabase
        .from('businesses')
        .select('*')
        .eq('id', profile?.business_id)
        .single()

    // Check if user has permission to edit
    const { data: membership } = await supabase
        .from('business_memberships')
        .select('role')
        .eq('user_id', user.id)
        .eq('business_id', profile?.business_id)
        .single()

    const canEdit = membership?.role === 'admin' || membership?.role === 'owner'

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Business Settings</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Manage your business profile and configuration
                </p>
            </div>

            {/* Business Profile */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Building2 className="h-5 w-5" />
                        Business Profile
                    </CardTitle>
                    <CardDescription>
                        {canEdit
                            ? "Manage your business information and branding"
                            : "View your business information (read-only)"
                        }
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {business ? (
                        <BusinessProfileForm
                            business={business}
                            canEdit={canEdit}
                        />
                    ) : (
                        <p className="text-sm text-muted-foreground">No business found</p>
                    )}
                </CardContent>
            </Card>

            {/* Business Verification Docs */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Verification Documents
                    </CardTitle>
                    <CardDescription>
                        Upload official business documents to become a verified lender.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <BusinessDocumentManagerWrapper
                        businessId={business?.id || ''}
                    />
                </CardContent>
            </Card>

            {/* Payment Instructions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Settings className="h-5 w-5" />
                        Payment Instructions
                    </CardTitle>
                    <CardDescription>
                        Configure how customers should pay you
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <PaymentSettingsForm
                        businessId={business?.id}
                        initialConfig={business?.payment_config || {}}
                    />
                </CardContent>
            </Card>
        </div>
    )
}

// Separate component for data fetching to avoid clutter
import { BusinessDocumentManager } from "@/components/admin/business-document-manager"

async function BusinessDocumentManagerWrapper({ businessId }: { businessId: string }) {
    if (!businessId) return null
    const supabase = await createClient()
    const { data: documents } = await supabase
        .from('business_documents')
        .select('*')
        .eq('business_id', businessId)
        .order('uploaded_at', { ascending: false })

    return <BusinessDocumentManager businessId={businessId} documents={documents || []} />
}
