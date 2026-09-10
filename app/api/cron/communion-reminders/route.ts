import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/database.types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Daily cron. Calls the database function that sends the communion
 * preparation reminders (a week before and the day before a month starts)
 * as in-app notifications. The function is granted to the service role
 * only, so this route is the one place the app uses that key.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET is not set' }, { status: 503 })
  if (request.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })

  const supabase = createClient<Database>(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { data, error } = await supabase.rpc('send_communion_reminders')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sent: data ?? 0 })
}
