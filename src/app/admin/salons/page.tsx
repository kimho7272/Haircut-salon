'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Search, ArrowUpDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSession } from '../AdminSessionContext'

type AdminSalon = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'paid'
  status: 'trial' | 'active' | 'suspended'
  seat_count: number
  owner_email: string | null
  customer_count: number
  appointment_count: number
  last_activity_at: string | null
  created_at: string
}

type SortKey = 'created_at' | 'seat_count' | 'last_activity_at' | 'name'

export default function AdminSalonsPage() {
  const { t } = useLanguage()
  const { session } = useAdminSession()
  const [salons, setSalons] = useState<AdminSalon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDesc, setSortDesc] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  const fetchSalons = async () => {
    const response = await fetch('/api/admin/salons', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (response.ok) {
      const result = await response.json()
      setSalons(result.salons)
    }
    setLoading(false)
  }

  useEffect(() => { fetchSalons() }, [])

  const updateSalon = async (salonId: string, updates: Partial<Pick<AdminSalon, 'plan' | 'status'>>) => {
    setSavingId(salonId)
    const response = await fetch('/api/admin/salons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ salonId, ...updates })
    })
    if (response.ok) {
      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, ...updates } : s))
    } else {
      alert(t('admin_update_failed'))
    }
    setSavingId(null)
  }

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDesc(prev => !prev)
    } else {
      setSortKey(key)
      setSortDesc(true)
    }
  }

  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase()
    let list = salons
    if (q) {
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.slug.toLowerCase().includes(q) ||
        (s.owner_email || '').toLowerCase().includes(q)
      )
    }
    const sorted = [...list].sort((a, b) => {
      let cmp = 0
      if (sortKey === 'name') cmp = a.name.localeCompare(b.name)
      else if (sortKey === 'seat_count') cmp = a.seat_count - b.seat_count
      else if (sortKey === 'last_activity_at') cmp = (a.last_activity_at || '').localeCompare(b.last_activity_at || '')
      else cmp = a.created_at.localeCompare(b.created_at)
      return sortDesc ? -cmp : cmp
    })
    return sorted
  }, [salons, search, sortKey, sortDesc])

  const SortHeader = ({ sortKeyValue, children }: { sortKeyValue: SortKey; children: React.ReactNode }) => (
    <th
      className="px-4 py-3 text-left font-semibold text-gray-600 cursor-pointer select-none hover:text-gray-900"
      onClick={() => toggleSort(sortKeyValue)}
    >
      <span className="flex items-center gap-1">
        {children}
        <ArrowUpDown className={`w-3 h-3 ${sortKey === sortKeyValue ? 'text-blue-600' : 'text-gray-300'}`} />
      </span>
    </th>
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold text-gray-900">{t('admin_nav_salons')} ({salons.length})</h1>
        <div className="relative w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin_search_placeholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-gray-500">{t('admin_loading')}</div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <SortHeader sortKeyValue="name">{t('admin_col_name')}</SortHeader>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_owner_email')}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_plan')}</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_status')}</th>
                <SortHeader sortKeyValue="seat_count">{t('admin_col_seats')}</SortHeader>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_customers')}</th>
                <SortHeader sortKeyValue="last_activity_at">{t('admin_col_last_activity')}</SortHeader>
                <SortHeader sortKeyValue="created_at">{t('admin_col_created')}</SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSorted.map(salon => (
                <tr key={salon.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/salons/${salon.id}`} className="font-medium text-blue-600 hover:text-blue-700">
                      {salon.name}
                    </Link>
                    <div className="text-xs text-gray-500">{salon.slug}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{salon.owner_email || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={salon.plan}
                      disabled={savingId === salon.id}
                      onChange={(e) => updateSalon(salon.id, { plan: e.target.value as 'free' | 'paid' })}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="free">{t('plan_free')}</option>
                      <option value="paid">{t('plan_paid')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={salon.status}
                      disabled={savingId === salon.id}
                      onChange={(e) => updateSalon(salon.id, { status: e.target.value as AdminSalon['status'] })}
                      className="border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="trial">{t('admin_status_trial')}</option>
                      <option value="active">{t('admin_status_active')}</option>
                      <option value="suspended">{t('admin_status_suspended')}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{salon.seat_count}</td>
                  <td className="px-4 py-3 text-gray-700">{salon.customer_count}</td>
                  <td className="px-4 py-3 text-gray-500">
                    {salon.last_activity_at ? new Date(salon.last_activity_at).toLocaleDateString() : t('admin_no_activity_yet')}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{new Date(salon.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
