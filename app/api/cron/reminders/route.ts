import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
    // 1. Verify Authorization (Cron Secret)
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return new NextResponse('Unauthorized', { status: 401 })
    }

    // 2. Initialize Admin DB Client
    // Note: We need service role key for cron jobs normally, or strict RLS policies that might block anon.
    // Ideally use createClient with SUPABASE_SERVICE_ROLE_KEY if bypassing RLS is needed.
    // For now, we'll try with ANON key but this might fail if RLS prevents reading other users 'loans'.
    // We MUST use Service Role for cron tasks usually.

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    try {
        // 3. Find Loans due in 2 days
        const targetDate = new Date()
        targetDate.setDate(targetDate.getDate() + 2)
        const targetStr = targetDate.toISOString().split('T')[0] // Compare dates roughly

        // Supabase query to filter loans status='active' and due_date around targetDate
        // using gte/lte for the whole day

        const { data: loans, error } = await supabase
            .from('loans')
            .select('*')
            .eq('status', 'active')
            // This date comparison assumes due_date is stored with time or just date. Be careful.
            // We'll simplistic check: due_date > now and due_date < now+3 days for pilot.
            .gte('due_date', new Date().toISOString())
            .lte('due_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())

        if (error) throw error

        let sentCount = 0

        // 4. Iterate and Insert into Outbox
        for (const loan of loans || []) {
            // Check for existing notification today
            const { data: existing } = await supabase
                .from('notification_outbox')
                .select('id')
                .eq('user_id', loan.user_id)
                .eq('subject', 'Loan Due Reminder')
                .gte('created_at', new Date().toISOString().split('T')[0]) // Created today
                .single()

            if (!existing) {
                await supabase.from('notification_outbox').insert({
                    user_id: loan.user_id,
                    business_id: loan.business_id, // Ensure business scoping
                    channel: 'sms', // Pilot default
                    recipient: loan.user_id, // Placeholder, would fetch phone
                    subject: 'Loan Due Reminder',
                    body: `Your loan of MWK ${loan.amount} is due soon. Please make a payment via the portal.`,
                    status: 'pending'
                })
                sentCount++
            }
        }

        return NextResponse.json({ success: true, processed: loans?.length, sent: sentCount })

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
