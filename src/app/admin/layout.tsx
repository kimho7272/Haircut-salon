'use client'

import { useState, useEffect, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShieldCheck, LogOut, Lock, Mail, LayoutDashboard, Store, History, Users } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'
import type { Session } from '@supabase/supabase-js'
import { AdminSessionContext } from './AdminSessionContext'

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

function AdminChrome({ session, children }: { session: Session; children: ReactNode }) {
  const { t, language, setLanguage } = useLanguage()
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: t('admin_nav_dashboard'), icon: LayoutDashboard },
    { href: '/admin/salons', label: t('admin_nav_salons'), icon: Store },
    { href: '/admin/activity', label: t('admin_nav_activity'), icon: History },
    { href: '/admin/operators', label: t('admin_nav_operators'), icon: Users },
  ]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-56 bg-gray-900 text-gray-300 flex flex-col shrink-0">
        <div className="px-4 py-4 flex items-center gap-2 border-b border-gray-800">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <span className="font-bold text-white text-sm leading-tight">{t('admin_console_title')}</span>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map(item => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                  active ? 'bg-blue-600 text-white' : 'hover:bg-gray-800 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-3 border-t border-gray-800 space-y-2">
          <button
            onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
            className="w-full text-left text-xs text-gray-400 hover:text-white px-3 py-1"
          >
            {language === 'ko' ? 'English' : '한국어'}
          </button>
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2 text-sm text-gray-400 hover:text-white px-3 py-2 rounded-lg hover:bg-gray-800"
          >
            <LogOut className="w-4 h-4" />
            {t('logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <AdminSessionContext.Provider value={{ session }}>
          {children}
        </AdminSessionContext.Provider>
      </main>
    </div>
  )
}

function AdminGate({ children }: { children: ReactNode }) {
  const { t } = useLanguage()
  const [session, setSession] = useState<Session | null | undefined>(undefined)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  const checkAccess = async (currentSession: Session) => {
    const response = await fetch('/api/admin/operators', {
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

  return <AdminChrome session={session}>{children}</AdminChrome>
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <AdminGate>{children}</AdminGate>
    </LanguageProvider>
  )
}
