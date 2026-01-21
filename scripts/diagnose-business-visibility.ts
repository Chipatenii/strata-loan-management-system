import { createClient } from '@supabase/supabase-js'

// Load env from .env.local
const SUPABASE_URL = "https://adgnzytrmlqnvshjryhz.supabase.co"
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ256eXRybWxxbnZzaGpyeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgxNjQ0NiwiZXhwIjoyMDg0MzkyNDQ2fQ.6igZ9CzjCQBaeDfd7cjzUrLzYqapEUKDixx7kQ74r7Q"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function diagnoseBusinessVisibility() {
    console.log('=== BUSINESS DATA VISIBILITY DIAGNOSTIC ===\n')

    // 1. List all businesses
    const { data: businesses, error: bizErr } = await supabase
        .from('businesses')
        .select('*')
        .order('created_at', { ascending: false })

    if (bizErr) {
        console.error('❌ Error fetching businesses:', bizErr)
        return
    }

    console.log(`📊 Total Businesses: ${businesses?.length}`)
    businesses?.forEach(biz => {
        console.log(`  - ${biz.name} (${biz.code})`)
        console.log(`    ID: ${biz.id}`)
        console.log(`    Created: ${biz.created_at}`)
        if (biz.payment_config) {
            console.log(`    Payment Config: ${JSON.stringify(biz.payment_config)}`)
        }
        console.log()
    })

    // 3. For each business, check related data
    for (const biz of businesses || []) {
        console.log(`\n📋 Business: ${biz.name} (${biz.code})`)
        console.log('─'.repeat(60))

        // Memberships
        const { data: members, error: memErr } = await supabase
            .from('business_memberships')
            .select('*, users(email, role, full_name)')
            .eq('business_id', biz.id)

        console.log(`  👥 Memberships: ${members?.length || 0}`)
        members?.forEach(m => {
            const user = m.users as any
            console.log(`    - ${user?.email} (${m.role})`)
        })

        // Customers
        const { data: customers, error: custErr } = await supabase
            .from('users')
            .select('id, email, full_name, role')
            .eq('business_id', biz.id)
            .neq('role', 'admin')

        console.log(`  👤 Customers: ${customers?.length || 0}`)
        customers?.forEach(c => {
            console.log(`    - ${c.email} (${c.full_name || 'No name'})`)
        })

        // KYC Records
        const { data: kyc, error: kycErr } = await supabase
            .from('kyc_records')
            .select('id, status, user_id')
            .eq('business_id', biz.id)

        console.log(`  📄 KYC Records: ${kyc?.length || 0}`)
        const kycByStatus = kyc?.reduce((acc: any, k) => {
            acc[k.status] = (acc[k.status] || 0) + 1
            return acc
        }, {})
        if (kycByStatus) {
            Object.entries(kycByStatus).forEach(([status, count]) => {
                console.log(`    - ${status}: ${count}`)
            })
        }

        // Loans
        const { data: loans, error: loansErr } = await supabase
            .from('loans')
            .select('id, status, amount, user_id')
            .eq('business_id', biz.id)

        console.log(`  💰 Loans: ${loans?.length || 0}`)
        const loansByStatus = loans?.reduce((acc: any, l) => {
            acc[l.status] = (acc[l.status] || 0) + 1
            return acc
        }, {})
        if (loansByStatus) {
            Object.entries(loansByStatus).forEach(([status, count]) => {
                console.log(`    - ${status}: ${count}`)
            })
        }

        // Products
        const { data: products, error: prodErr } = await supabase
            .from('loan_products')
            .select('id, name, is_active')
            .eq('business_id', biz.id)

        console.log(`  📦 Loan Products: ${products?.length || 0}`)
        products?.forEach(p => {
            console.log(`    - ${p.name} (${p.is_active ? 'Active' : 'Inactive'})`)
        })

        // Check for any errors
        if (memErr || custErr || kycErr || loansErr || prodErr) {
            console.log('\n  ⚠️  Errors encountered:')
            if (memErr) console.log(`    - Memberships: ${memErr.message}`)
            if (custErr) console.log(`    - Customers: ${custErr.message}`)
            if (kycErr) console.log(`    - KYC: ${kycErr.message}`)
            if (loansErr) console.log(`    - Loans: ${loansErr.message}`)
            if (prodErr) console.log(`    - Products: ${prodErr.message}`)
        }
    }

    console.log('\n' + '='.repeat(60))
    console.log('✅ Diagnostic Complete')
}

diagnoseBusinessVisibility()
