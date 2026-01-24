const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function checkBusinesses() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    const { data: businesses, error } = await supabase
        .from('businesses')
        .select('id, name, code, payment_instructions')

    if (error) {
        console.error('Error fetching businesses:', error)
        return
    }

    console.log('Businesses found:')
    console.log(JSON.stringify(businesses, null, 2))

    // Also check users to see what business they are tied to
    const { data: users } = await supabase
        .from('users')
        .select('email, business_id')
        .limit(5)

    console.log('\nUsers (first 5):')
    console.log(JSON.stringify(users, null, 2))
}

checkBusinesses()
