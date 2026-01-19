
import { createClient } from '@supabase/supabase-js'

// Hardcode for script execution
const supabaseUrl = "https://adgnzytrmlqnvshjryhz.supabase.co"
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFkZ256eXRybWxxbnZzaGpyeWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODgxNjQ0NiwiZXhwIjoyMDg0MzkyNDQ2fQ.6igZ9CzjCQBaeDfd7cjzUrLzYqapEUKDixx7kQ74r7Q"

if (!supabaseUrl) {
    console.error("Credentials missing")
    process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function verifySchema() {
    console.log("Verifying Schema Changes...")

    // Check Users table for 'address' and 'phone'
    const { data: users, error: uErr } = await supabase.from('users').select('address, phone').limit(1)
    if (uErr) {
        console.error("Error checking users table:", uErr.message)
    } else {
        console.log("Users table has 'address' and 'phone' columns (accessed successfully).")
    }

    // Check KYC Records for 'bank_statement_url'
    const { data: kyc, error: kErr } = await supabase.from('kyc_records').select('bank_statement_url, payslip_url').limit(1)
    if (kErr) {
        console.error("Error checking kyc_records table:", kErr.message)
    } else {
        console.log("KYC Records table has 'bank_statement_url' column.")
    }
}

verifySchema()
