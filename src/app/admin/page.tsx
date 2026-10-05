'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, LogOut, Lock, Mail } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'

type AdminSalon = {
  id: string
  name: string
  slug: string
  plan: 'free' | 'paid'
  status: 'trial' | 'active' | 'suspended'
  seat_count: number
  created_at: string
}

function AdminLogin({ onSignedIn }: { onSignedIn: () => void }) {
  const { t } = useLanguage()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })

    if (signInError) {
      setError(t('login_error_invalid'))
      setLoading(false)
      return
    }

    onSignedIn()
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-gray-800 rounded-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <ShieldCheck className="w-10 h-10 text-blue-400 mx-auto" />
          <h1 className="text-xl font-bold text-white">{t('admin_console_title')}</h1>
          <p className="text-sm text-gray-400">{t('admin_login_prompt')}</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="email"
              required
              placeholder={t('email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="password"
              required
              placeholder={t('password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
          >
            {loading ? t('signing_in') : t('sign_in')}
          </button>
        </form>
      </div>
    </div>
  )
}

function AdminDashboard({ session, onSignOut }: { session: Session; onSignOut: () => void }) {
  const { t, language, setLanguage } = useLanguage()
  const [salons, setSalons] = useState<AdminSalon[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchSalons()
  }, [])

  const fetchSalons = async () => {
    setLoading(true)
    const response = await fetch('/api/admin/salons', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (response.ok) {
      const result = await response.json()
      setSalons(result.salons)
    }
    setLoading(false)
  }

  const updateSalon = async (salonId: string, updates: Partial<Pick<AdminSalon, 'plan' | 'status'>>) => {
    setSavingId(salonId)
    const response = await fetch('/api/admin/salons', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ salonId, ...updates })
    })
    if (response.ok) {
      setSalons(prev => prev.map(s => s.id === salonId ? { ...s, ...updates } : s))
    } else {
      alert(t('admin_update_failed'))
    }
    setSavingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-gray-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-400" />
          <h1 className="font-bold">{t('admin_console_title')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            className="text-sm text-gray-300 hover:text-white"
          >
            {language === 'ko' ? 'EN' : '한국어'}
          </button>
          <button onClick={onSignOut} className="flex items-center gap-1 text-sm text-gray-300 hover:text-white">
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">
          {t('admin_salon_list_title')} ({salons.length})
        </h2>

        {loading ? (
          <div className="text-gray-500">Loading...</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_name')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_plan')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_status')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_seats')}</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">{t('admin_col_created')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {salons.map(salon => (
                  <tr key={salon.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{salon.name}</div>
                      <div className="text-xs text-gray-500">{salon.slug}</div>
                    </td>
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
                    <td className="px-4 py-3 text-gray-500">
                      {new Date(salon.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function AdminGate() {
  const { t } = useLanguage()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const checkAccess = async (currentSession: Session) => {
    const response = await fetch('/api/admin/salons', {
      headers: { Authorization: `Bearer ${currentSession.access_token}` }
    })
    setIsAdmin(response.ok)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      if (data.session) checkAccess(data.session)
      else setIsAdmin(false)
    })
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setIsAdmin(false)
  }

  if (session === undefined || (session && isAdmin === null)) {
    return <div className="min-h-screen bg-gray-900" />
  }

  if (!session) {
    return (
      <AdminLogin
        onSignedIn={async () => {
          const { data } = await supabase.auth.getSession()
          setSession(data.session)
          if (data.session) await checkAccess(data.session)
        }}
      />
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-gray-800 rounded-xl p-8 text-center space-y-4">
          <p className="text-red-400">{t('admin_access_denied')}</p>
          <button
            onClick={handleSignOut}
            className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    )
  }

  return <AdminDashboard session={session} onSignOut={handleSignOut} />
}

export default function AdminPage() {
  return (
    <LanguageProvider>
      <AdminGate />
    </LanguageProvider>
  )
}
