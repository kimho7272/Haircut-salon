import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { logAdminEvent } from '@/lib/adminAudit'
import { resolveAvailableSlug } from '@/lib/slug'

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const salonName = body?.salonName?.trim()
  const adminName = body?.adminName?.trim()
  const email = body?.email?.trim()
  const password = body?.password

  if (!salonName || !adminName || !email || !password || password.length < 6) {
    return NextResponse.json({ error: 'invalid_input' }, { status: 400 })
  }

  const slug = await resolveAvailableSlug(salonName)

  const { data: createdUser, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (userError || !createdUser.user) {
    const isDuplicate = userError?.message?.toLowerCase().includes('already')
    return NextResponse.json(
      { error: isDuplicate ? 'email_taken' : 'signup_failed', detail: userError?.message },
      { status: isDuplicate ? 409 : 500 }
    )
  }

  const userId = createdUser.user.id

  const { data: salon, error: salonError } = await supabaseAdmin
    .from('salons')
    .insert([{ name: salonName, slug, plan: 'free', status: 'active', owner_user_id: userId }])
    .select()
    .single()

  if (salonError || !salon) {
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'signup_failed', detail: salonError?.message }, { status: 500 })
  }

  const { error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .insert([{ user_id: userId, salon_id: salon.id, name: adminName, role: 'admin', contact_email: email }])

  if (profileError) {
    await supabaseAdmin.from('salons').delete().eq('id', salon.id)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return NextResponse.json({ error: 'signup_failed', detail: profileError.message }, { status: 500 })
  }

  await logAdminEvent({
    actorUserId: userId,
    actorType: 'system',
    action: 'salon_created',
    targetSalonId: salon.id,
    detail: { salonName, slug, ownerEmail: email },
  })

  return NextResponse.json({ success: true, salonId: salon.id, userId, slug })
}
