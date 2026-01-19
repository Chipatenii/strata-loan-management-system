import { createClient } from '@supabase/supabase-js'

// Load env from .env.local
// Hardcoded for script execution context where .env loading is flaky without dotenv package
const SUPABASE_URL = "https://adgnzytrmlqnvshjryhz.supabase.co"
const SUPABASE_SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ256eXRybWxxbnZzaGpyeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgxNjQ0NiwiZXhwIjoyMDg0MzkyNDQ2fQ.6igZ9CzjCQBaeDfd7cjzUrLzYqapEUKDixx7kQ74r7Q"

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)

async function diagnose() {
    console.log('--- START DIAGNOSIS ---')

    // 1. Get Target Business
    const { data: businesses, error: bErr } = await supabase
        .from('businesses')
        .select('*')

    if (bErr) console.error('Error fetching businesses:', bErr)
    else console.log('Businesses:', businesses?.map(b => `${b.code} (${b.id}) - ${b.name}`))

    const targetBiz = businesses?.find(b => b.code === 'BIZ387033')
    if (!targetBiz) {
        console.error('CRITICAL: Business BIZ387033 NOT FOUND')
    } else {
        console.log(`Target Business Found: ${targetBiz.id}`)
    }

    // 2. Check Users
    const { data: users, error: uErr } = await supabase
        .from('users')
        .select('id, email, business_id, role, full_name')
        .neq('role', 'admin') // Focus on customers

    if (uErr) console.error('Error fetching users:', uErr)
    else {
        console.log(`Total Customers: ${users?.length}`)
        const orphans = users?.filter(u => !u.business_id)
        const defaults = users?.filter(u => u.business_id === '00000000-0000-0000-0000-000000000000')
        const mismatches = users?.filter(u => u.business_id && u.business_id !== targetBiz?.id && u.business_id !== '00000000-0000-0000-0000-000000000000')

        console.log(`Orphan Users (No Business): ${orphans?.length}`)
        console.log(`Default Business Users: ${defaults?.length}`)
        console.log(`Other Business Users: ${mismatches?.length}`)

        if (orphans?.length) console.log('Sample Orphan:', orphans[0])
        if (defaults?.length) console.log('Sample Default:', defaults[0])
    }

    // 3. Check Loans
    const { data: loans, error: lErr } = await supabase
        .from('loans')
        .select('id, user_id, business_id, amount')

    if (lErr) console.error('Error fetching loans:', lErr)
    else {
        console.log(`Total Loans: ${loans?.length}`)
        const loanOrphans = loans?.filter(l => !l.business_id)
        const loanDefaults = loans?.filter(l => l.business_id === '00000000-0000-0000-0000-000000000000')

        console.log(`Orphan Loans: ${loanOrphans?.length}`)
        console.log(`Default Loans: ${loanDefaults?.length}`)

        // Check consistency: User Business vs Loan Business
        const inconsistencies = loans?.filter(l => {
            const u = users?.find(user => user.id === l.user_id)
            return u && u.business_id !== l.business_id
        })
        console.log(`Loans with Business ID mismatching User Business ID: ${inconsistencies?.length}`)
        if (inconsistencies?.length) console.log('Sample Inconsistency:', inconsistencies[0])
    }

    // 4. Check Business Memberships (Admins)
    const { data: members, error: mErr } = await supabase
        .from('business_memberships')
        .select('user_id, business_id, role, users(email)')

    if (mErr) console.error('Error fetching memberships:', mErr)
    else {
        console.log(`Total Memberships: ${members?.length}`)
        members?.forEach(m => {
            const b = businesses?.find(biz => biz.id === m.business_id)
            console.log(`Admin ${(m.users as any)?.email} is in Business: ${b?.name} (${b?.code})`)
        })
    }

    // 5. Check KYC Records
    const { data: kyc, error: kErr } = await supabase
        .from('kyc_records')
        .select('id, user_id, business_id, status')

    if (kErr) console.error('Error fetching KYC:', kErr)
    else {
        console.log(`Total KYC Records: ${kyc?.length}`)
        const kycOrphans = kyc?.filter(k => !k.business_id)
        const kycDefaults = kyc?.filter(k => k.business_id === '00000000-0000-0000-0000-000000000000')
        console.log(`Orphan KYC: ${kycOrphans?.length}`)
        console.log(`Default Business KYC: ${kycDefaults?.length}`)
        const kycTarget = kyc?.filter(k => k.business_id === targetBiz?.id)
        console.log(`Target Business KYC: ${kycTarget?.length} (Should be > 0 if user submitted)`)
    }

    // 6. Check Loan Products
    const { data: products, error: pErr } = await supabase
        .from('loan_products')
        .select('id, name, business_id, is_active')

    if (pErr) console.error('Error fetching Products:', pErr)
    else {
        console.log(`Total Products: ${products?.length}`)
        const prodTarget = products?.filter(p => p.business_id === targetBiz?.id)
        console.log(`Target Business Products: ${prodTarget?.length}`)
    }

    console.log('--- END DIAGNOSIS ---')
}

diagnose()
