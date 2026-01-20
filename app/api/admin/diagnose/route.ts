import { createClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

// Secure Admin-Only Diagnostic Endpoint
export async function GET() {
    const supabase = await createClient()

    // 1. Authenticate
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    // 2. Authorization (Strict Admin Check)
    // We check if they have a business membership with role 'admin'
    const { data: membership } = await supabase
        .from('business_memberships')
        .select('role, business_id')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single()

    if (!membership) {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    // 3. fetch Stats for their business
    const businessId = membership.business_id

    // Loans Summary
    const { data: loans, error: loansError } = await supabase
        .from('loans')
        .select('status, id')
        .eq('business_id', businessId)

    // KYC Summary
    const { data: kyc, error: kycError } = await supabase
        .from('kyc_records')
        .select('status, id')
        .eq('business_id', businessId)

    // Aggregate counts
    const loanCounts = loans?.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
    }, {})

    const kycCounts = kyc?.reduce((acc: any, curr) => {
        acc[curr.status] = (acc[curr.status] || 0) + 1
        return acc
    }, {})

    return NextResponse.json({
        timestamp: new Date().toISOString(),
        admin_user: user.email,
        business_id: businessId,
        db_status: {
            loans: loanCounts || {},
            kyc: kycCounts || {},
        },
        errors: {
            loans: loansError,
            kyc: kycError
        },
        note: "This data shows what is visible to your admin account via RLS."
    })
}
