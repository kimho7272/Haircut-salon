import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'
import { logAdminEvent } from '@/lib/adminAudit'

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
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

  const [{ data: members }, { data: customers }, { data: appointments }] = await Promise.all([
    supabaseAdmin.from('user_profiles').select('salon_id, user_id, contact_email'),
    supabaseAdmin.from('customers').select('salon_id'),
    supabaseAdmin.from('appointments').select('salon_id, created_at'),
  ])

  const seatCountBySalon = new Map<string, number>()
  const ownerEmailBySalon = new Map<string, string>()
  for (const salon of salons) {
    const salonMembers = (members || []).filter(m => m.salon_id === salon.id)
    seatCountBySalon.set(salon.id, salonMembers.length)
    const owner = salonMembers.find(m => m.user_id === salon.owner_user_id)
    if (owner) ownerEmailBySalon.set(salon.id, owner.contact_email)
  }

  const customerCountBySalon = new Map<string, number>()
  for (const row of customers || []) {
    customerCountBySalon.set(row.salon_id, (customerCountBySalon.get(row.salon_id) || 0) + 1)
  }

  const appointmentCountBySalon = new Map<string, number>()
  const lastActivityBySalon = new Map<string, string>()
  for (const row of appointments || []) {
    appointmentCountBySalon.set(row.salon_id, (appointmentCountBySalon.get(row.salon_id) || 0) + 1)
    const current = lastActivityBySalon.get(row.salon_id)
    if (!current || row.created_at > current) {
      lastActivityBySalon.set(row.salon_id, row.created_at)
    }
  }

  const result = salons.map(salon => ({
    ...salon,
    seat_count: seatCountBySalon.get(salon.id) || 0,
    owner_email: ownerEmailBySalon.get(salon.id) || null,
    customer_count: customerCountBySalon.get(salon.id) || 0,
    appointment_count: appointmentCountBySalon.get(salon.id) || 0,
    last_activity_at: lastActivityBySalon.get(salon.id) || null,
  }))

  return NextResponse.json({ salons: result })
}

export async function PATCH(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  const salonId = body?.salonId
  const updates: { plan?: 'free' | 'paid'; status?: 'trial' | 'active' | 'suspended'; notes?: string } = {}

  if (body?.plan === 'free' || body?.plan === 'paid') updates.plan = body.plan
  if (body?.status === 'trial' || body?.status === 'active' || body?.status === 'suspended') {
    updates.status = body.status
  }
  if (typeof body?.notes === 'string') updates.notes = body.notes

  if (!salonId || Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const { data: before } = await supabaseAdmin
    .from('salons')
    .select('plan, status')
    .eq('id', salonId)
    .maybeSingle()

  const { error } = await supabaseAdmin.from('salons').update(updates).eq('id', salonId)

  if (error) {
    return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  }

  if (updates.plan && updates.plan !== before?.plan) {
    await logAdminEvent({
      actorUserId: admin.id,
      actorType: 'platform_admin',
      action: 'plan_changed',
      targetSalonId: salonId,
      detail: { from: before?.plan, to: updates.plan },
    })
  }
  if (updates.status && updates.status !== before?.status) {
    await logAdminEvent({
      actorUserId: admin.id,
      actorType: 'platform_admin',
      action: 'status_changed',
      targetSalonId: salonId,
      detail: { from: before?.status, to: updates.status },
    })
  }
  if (typeof updates.notes === 'string') {
    await logAdminEvent({
      actorUserId: admin.id,
      actorType: 'platform_admin',
      action: 'notes_updated',
      targetSalonId: salonId,
    })
  }

  return NextResponse.json({ success: true })
}
