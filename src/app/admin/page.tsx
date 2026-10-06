'use client'

import { useState, useEffect } from 'react'
import { Store, CreditCard, UserPlus, Users2, ArrowRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSession } from './AdminSessionContext'

type Overview = {
  totalSalons: number
  paidSalons: number
  freeSalons: number
  suspendedSalons: number
  newThisWeek: number
  totalSeats: number
  recentSalons: { id: string; name: string; slug: string; plan: string; status: string; created_at: string }[]
}

function KpiCard({ icon: Icon, label, value, accent }: { icon: typeof Store; label: string; value: number | string; accent: string }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${accent}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  const { t } = useLanguage()
  const { session } = useAdminSession()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(setOverview)
      .finally(() => setLoading(false))
  }, [session])

  if (loading) {
    return <div className="p-6 text-gray-500">{t('admin_loading')}</div>
  }

  if (!overview) {
    return <div className="p-6 text-gray-500">{t('admin_not_found')}</div>
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold text-gray-900">{t('admin_nav_dashboard')}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={Store} label={t('admin_kpi_total_salons')} value={overview.totalSalons} accent="bg-blue-100 text-blue-600" />
        <KpiCard icon={CreditCard} label={t('admin_kpi_paid_salons')} value={`${overview.paidSalons} / ${overview.totalSalons}`} accent="bg-purple-100 text-purple-600" />
        <KpiCard icon={UserPlus} label={t('admin_kpi_new_this_week')} value={overview.newThisWeek} accent="bg-green-100 text-green-600" />
        <KpiCard icon={Users2} label={t('admin_kpi_total_seats')} value={overview.totalSeats} accent="bg-amber-100 text-amber-600" />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{t('admin_recent_salons')}</h2>
          <a href="/admin/salons" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
            {t('admin_nav_salons')} <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
        <div className="divide-y divide-gray-100">
          {overview.recentSalons.length === 0 && (
            <p className="px-5 py-6 text-sm text-gray-500">{t('admin_no_activity_yet')}</p>
          )}
          {overview.recentSalons.map(salon => (
            <a
              key={salon.id}
              href={`/admin/salons/${salon.id}`}
              className="flex items-center justify-between px-5 py-3 hover:bg-gray-50 transition-colors"
            >
              <div>
                <p className="font-medium text-gray-900 text-sm">{salon.name}</p>
                <p className="text-xs text-gray-500">{salon.slug}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  salon.plan === 'paid' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {salon.plan === 'paid' ? t('plan_paid') : t('plan_free')}
                </span>
                <span className="text-xs text-gray-400">{new Date(salon.created_at).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
