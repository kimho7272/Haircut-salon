'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users2, ShoppingBag, Clock, Save, AlertTriangle, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSession } from '../../AdminSessionContext'

type SalonDetail = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'paid'
  status: 'trial' | 'active' | 'suspended'
  notes: string | null
  created_at: string
}

type Member = {
  id: string
  user_id: string
  name: string
  role: 'admin' | 'staff'
  contact_email: string
  created_at: string
}

export default function AdminSalonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useLanguage()
  const { session } = useAdminSession()
  const router = useRouter()

  const [salon, setSalon] = useState<SalonDetail | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [usage, setUsage] = useState<{ customerCount: number; serviceCount: number; lastActivityAt: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [notes, setNotes] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [notesSaved, setNotesSaved] = useState(false)
  const [savingField, setSavingField] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleting, setDeleting] = useState(false)

  const fetchDetail = async () => {
    const response = await fetch(`/api/admin/salons/${id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (response.ok) {
      const result = await response.json()
      setSalon(result.salon)
      setMembers(result.members)
      setUsage(result.usage)
      setNotes(result.salon.notes || '')
    }
    setLoading(false)
  }

  useEffect(() => { fetchDetail() }, [id])

  const updateSalon = async (updates: Record<string, unknown>) => {
    setSavingField(true)
    const response = await fetch('/api/admin/salons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ salonId: id, ...updates })
    })
    if (response.ok && salon) {
      setSalon({ ...salon, ...updates } as SalonDetail)
    } else {
      alert(t('admin_update_failed'))
    }
    setSavingField(false)
  }

  const saveNotes = async () => {
    setSavingNotes(true)
    setNotesSaved(false)
    const response = await fetch('/api/admin/salons', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ salonId: id, notes })
    })
    if (response.ok) {
      setNotesSaved(true)
      setTimeout(() => setNotesSaved(false), 2000)
    } else {
      alert(t('admin_update_failed'))
    }
    setSavingNotes(false)
  }

  const handleDelete = async () => {
    if (!salon || deleteConfirmText !== salon.slug) return
    setDeleting(true)
    const response = await fetch(`/api/admin/salons/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ confirmSlug: deleteConfirmText })
    })
    if (response.ok) {
      router.push('/admin/salons')
    } else {
      alert(t('admin_delete_salon_failed'))
      setDeleting(false)
    }
  }

  if (loading) {
    return <div className="p-6 text-gray-500">{t('admin_loading')}</div>
  }

  if (!salon) {
    return <div className="p-6 text-gray-500">{t('admin_not_found')}</div>
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link href="/admin/salons" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> {t('admin_back_to_list')}
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{salon.name}</h1>
            <p className="text-sm text-gray-500 font-mono">{salon.slug}</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={salon.plan}
              disabled={savingField}
              onChange={(e) => updateSalon({ plan: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="free">{t('plan_free')}</option>
              <option value="paid">{t('plan_paid')}</option>
            </select>
            <select
              value={salon.status}
              disabled={savingField}
              onChange={(e) => updateSalon({ status: e.target.value })}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            >
              <option value="trial">{t('admin_status_trial')}</option>
              <option value="active">{t('admin_status_active')}</option>
              <option value="suspended">{t('admin_status_suspended')}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-600 rounded-lg"><Users2 className="w-4 h-4" /></div>
          <div>
            <p className="text-xs text-gray-500">{t('admin_col_customers')}</p>
            <p className="text-lg font-bold text-gray-900">{usage?.customerCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-600 rounded-lg"><ShoppingBag className="w-4 h-4" /></div>
          <div>
            <p className="text-xs text-gray-500">{t('service_management')}</p>
            <p className="text-lg font-bold text-gray-900">{usage?.serviceCount ?? 0}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 text-amber-600 rounded-lg"><Clock className="w-4 h-4" /></div>
          <div>
            <p className="text-xs text-gray-500">{t('admin_col_last_activity')}</p>
            <p className="text-sm font-bold text-gray-900">
              {usage?.lastActivityAt ? new Date(usage.lastActivityAt).toLocaleDateString() : t('admin_no_activity_yet')}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">{t('admin_salon_members')} ({members.length})</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {members.map(m => (
            <div key={m.id} className="flex items-center justify-between px-5 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-900">{m.name}</span>
                <span className="text-xs text-gray-500">{m.contact_email}</span>
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                  m.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {m.role === 'admin' ? t('admin_role') : t('staff_role')}
                </span>
              </div>
              <span className="text-xs text-gray-400">{new Date(m.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-gray-900">{t('admin_salon_notes')}</h2>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={t('admin_salon_notes_placeholder')}
          rows={4}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        <div className="flex items-center gap-3">
          <button
            onClick={saveNotes}
            disabled={savingNotes}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm"
          >
            <Save className="w-3.5 h-3.5" />
            {t('admin_save_notes')}
          </button>
          {notesSaved && <span className="text-sm text-green-600">{t('admin_notes_saved')}</span>}
        </div>
      </div>

      <Link
        href={`/admin/activity?salonId=${id}`}
        className="inline-block text-sm text-blue-600 hover:text-blue-700"
      >
        {t('admin_nav_activity')} →
      </Link>

      <div className="bg-white rounded-lg border border-red-200 shadow-sm p-5 space-y-3">
        <h2 className="font-bold text-red-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {t('admin_danger_zone')}
        </h2>
        <p className="text-sm text-gray-600">{t('admin_delete_salon_warning')}</p>
        <button
          onClick={() => { setDeleteConfirmText(''); setShowDeleteModal(true) }}
          className="flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <Trash2 className="w-3.5 h-3.5" />
          {t('admin_delete_salon')}
        </button>
      </div>

      {showDeleteModal && (
        <div
          className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'none' }}
        >
          <div className="bg-white rounded-lg shadow-xl border-2 border-red-400 max-w-md w-full">
            <div className="flex items-center justify-between py-2 px-4 border-b border-red-200 bg-red-50">
              <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                {t('admin_delete_salon')}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-gray-700">{t('admin_delete_salon_warning')}</p>
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {salon.name} — {usage?.customerCount ?? 0} {t('admin_col_customers')}, {members.length} {t('admin_salon_members')}
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {t('admin_delete_salon_confirm_prompt')}: <span className="font-mono font-bold">{salon.slug}</span>
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex gap-3 p-6 pt-0">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting || deleteConfirmText !== salon.slug}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? t('admin_deleting') : t('admin_delete_salon_button')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
