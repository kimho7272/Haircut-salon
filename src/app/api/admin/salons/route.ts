import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, getCallerUser } from '@/lib/supabase-admin'

const requirePlatformAdmin = async (request: NextRequest) => {
  const caller = await getCallerUser(request.headers.get('authorization'))
  if (!caller) return null

  const { data } = await supabaseAdmin
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', caller.id)
    .maybeSingle()

  return data ? caller : null
}

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: salons, error } = await supabaseAdmin
    .from('salons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error || !salons) {
    return NextResponse.json({ error: 'query_failed' }, { status: 500 })
  }

  const { data: memberCounts } = await supabaseAdmin
    .from('user_profiles')
    .select('salon_id')

  const countBySalon = new Map<string, number>()
  for (const row of memberCounts || []) {
    countBySalon.set(row.salon_id, (countBySalon.get(row.salon_id) || 0) + 1)
  }

  const result = salons.map(salon => ({
    ...salon,
    seat_count: countBySalon.get(salon.id) || 0,
  }))

  return NextResponse.json({ salons: result })
}

export async function PATCH(request: NextRequest) {
  const admin = await requirePlatformAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const salonId = body?.salonId
  const updates: { plan?: 'free' | 'paid'; status?: 'trial' | 'active' | 'suspended' } = {}

  if (body?.plan === 'free' || body?.plan === 'paid') updates.plan = body.plan
  if (body?.status === 'trial' || body?.status === 'active' || body?.status === 'suspended') {
    updates.status = body.status
  }

  if (!salonId || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('salons').update(updates).eq('id', salonId)

  if (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
