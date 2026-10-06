'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Lock, User, Eye, EyeOff, Scissors, Sparkles } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'
import { supabase } from '@/lib/supabase'

function SalonLoginForm({ slug }: { slug: string }) {
  const { t } = useLanguage()
  const router = useRouter()

  const [salonName, setSalonName] = useState<string | null>(null)
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/salon-info?slug=${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : null)
      .then(result => setSalonName(result?.name || null))
      .catch(() => setSalonName(null))
  }, [slug])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError(t('login_error_empty'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/staff-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, ...formData })
      })
      const result = await response.json()

      if (!response.ok || !result.access_token) {
        setError(t('login_error_invalid'))
        setLoading(false)
        return
      }

      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
      })

      if (setSessionError) {
        setError(t('login_error_failed'))
        setLoading(false)
        return
      }

      router.push('/')
    } catch (err) {
      setError(t('login_error_failed'))
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center items-center space-x-2 mb-4">
            <Sparkles className="h-8 w-8 text-pink-500" />
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Scissors className="h-8 w-8 text-white" />
            </div>
            <Sparkles className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600 mb-2">
            {t('welcome_to')}
          </h1>
          <h2 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-700 mb-4">
            {salonName || slug}
          </h2>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('sign_in_to_account')}
            </h3>

            <form className="space-y-6 mt-4" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder={t('email')}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-12"
                    placeholder={t('password')}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <LanguageSelector isCollapsed={false} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                {loading ? t('signing_in') : t('sign_in')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SalonLoginPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

  return (
    <LanguageProvider>
      <SalonLoginForm slug={slug || ''} />
    </LanguageProvider>
  )
}
