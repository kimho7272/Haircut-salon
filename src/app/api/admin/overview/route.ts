import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin, requirePlatformAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const admin = await requirePlatformAdmin(request.headers.get('authorization'))
  if (!admin) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const { data: salons } = await supabaseAdmin
    .from('salons')
    .select('id, name, slug, plan, status, created_at')
    .order('created_at', { ascending: false })

  const { data: members } = await supabaseAdmin
    .from('user_profiles')
    .select('salon_id')

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const totalSalons = salons?.length || 0
  const paidSalons = salons?.filter(s => s.plan === 'paid').length || 0
  const suspendedSalons = salons?.filter(s => s.status === 'suspended').length || 0
  const newThisWeek = salons?.filter(s => s.created_at >= sevenDaysAgo).length || 0
  const totalSeats = members?.length || 0
  const recentSalons = (salons || []).slice(0, 8)

  return NextResponse.json({
    totalSalons,
    paidSalons,
    freeSalons: totalSalons - paidSalons,
    suspendedSalons,
    newThisWeek,
    totalSeats,
    recentSalons,
  })
}
