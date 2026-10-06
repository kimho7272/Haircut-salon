import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { id } = await params

  const { data: salon, error } = await supabaseAdmin
    .from('salons')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !salon) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  const [membersResult, customersResult, servicesResult, appointmentsResult] = await Promise.all([
    supabaseAdmin
      .from('user_profiles')
      .select('id, user_id, name, role, contact_email, created_at')
      .eq('salon_id', id)
      .order('created_at', { ascending: true }),
    supabaseAdmin.from('customers').select('id', { count: 'exact', head: true }).eq('salon_id', id),
    supabaseAdmin.from('services').select('id', { count: 'exact', head: true }).eq('salon_id', id),
    supabaseAdmin.from('appointments').select('created_at').eq('salon_id', id).order('created_at', { ascending: false }).limit(1),
  ])

  return NextResponse.json({
    salon,
    members: membersResult.data || [],
    usage: {
      customerCount: customersResult.count ?? 0,
      serviceCount: servicesResult.count ?? 0,
      lastActivityAt: appointmentsResult.data?.[0]?.created_at || null,
    },
  })
}
