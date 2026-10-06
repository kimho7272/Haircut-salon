'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { History, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSession } from '../AdminSessionContext'

type AuditEvent = {
  id: string
  action: string
  actor_type: 'platform_admin' | 'system'
  actorEmail: string | null
  targetSalon: { id: string; name: string; slug: string } | null
  detail: Record<string, unknown> | null
  created_at: string
}

const ACTION_KEY: Record<string, string> = {
  salon_created: 'admin_activity_action_salon_created',
  plan_changed: 'admin_activity_action_plan_changed',
  status_changed: 'admin_activity_action_status_changed',
  notes_updated: 'admin_activity_action_notes_updated',
  staff_invited: 'admin_activity_action_staff_invited',
  staff_removed: 'admin_activity_action_staff_removed',
  operator_added: 'admin_activity_action_operator_added',
  operator_removed: 'admin_activity_action_operator_removed',
}

function describeDetail(action: string, detail: Record<string, unknown> | null): string {
  if (!detail) return ''
  if (action === 'plan_changed' || action === 'status_changed') {
    return `${detail.from ?? '?'} → ${detail.to ?? '?'}`
  }
  if (action === 'staff_invited' || action === 'staff_removed') {
    return String(detail.email ?? '')
  }
  if (action === 'operator_added' || action === 'operator_removed') {
    return String(detail.email ?? '')
  }
  if (action === 'salon_created') {
    return String(detail.ownerEmail ?? '')
  }
  return ''
}

function AdminActivityContent() {
  const { t } = useLanguage()
  const { session } = useAdminSession()
  const searchParams = useSearchParams()
  const salonIdFilter = searchParams.get('salonId')

  const [events, setEvents] = useState<AuditEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const url = salonIdFilter ? `/api/admin/activity?salonId=${salonIdFilter}` : '/api/admin/activity'
    fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(result => setEvents(result?.events || []))
      .finally(() => setLoading(false))
  }, [session, salonIdFilter])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <History className="w-5 h-5 text-gray-500" />
          {t('admin_nav_activity')}
        </h1>
        {salonIdFilter && (
          <a href="/admin/activity" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <X className="w-3.5 h-3.5" /> {events[0]?.targetSalon?.name || salonIdFilter}
          </a>
        )}
      </div>

      {loading ? (
        <div className="text-gray-500">{t('admin_loading')}</div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm px-5 py-8 text-center text-gray-500 text-sm">
          {t('admin_activity_empty')}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
          {events.map(event => (
            <div key={event.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full shrink-0 ${
                  event.actor_type === 'platform_admin' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
                }`}>
                  {t(ACTION_KEY[event.action] || event.action)}
                </span>
                {event.targetSalon && !salonIdFilter && (
                  <a href={`/admin/salons/${event.targetSalon.id}`} className="font-medium text-blue-600 hover:text-blue-700 truncate">
                    {event.targetSalon.name}
                  </a>
                )}
                <span className="text-gray-500 truncate">{describeDetail(event.action, event.detail)}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400 shrink-0">
                {event.actorEmail && <span>{event.actorEmail}</span>}
                <span>{new Date(event.created_at).toLocaleString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminActivityPage() {
  return (
    <Suspense fallback={null}>
      <AdminActivityContent />
    </Suspense>
  )
}
