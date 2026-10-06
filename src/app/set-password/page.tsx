'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Lock, Scissors, Sparkles } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import { supabase } from '@/lib/supabase'

function SetPasswordForm() {
  const { t } = useLanguage()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [ready, setReady] = useState(false)
  const [linkError, setLinkError] = useState(false)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const establishSession = async () => {
      // Supabase 초대/복구 링크는 PKCE(?code=)나 구형(#access_token=) 둘 중 하나로 옴
      const code = searchParams.get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        setReady(!error)
        setLinkError(Boolean(error))
        return
      }

      const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
      const hashParams = new URLSearchParams(hash)
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
        setReady(!error)
        setLinkError(Boolean(error))
        return
      }

      // 이미 세션이 있는 상태로 직접 들어온 경우(예: 재시도)도 허용
      const { data } = await supabase.auth.getSession()
      setReady(Boolean(data.session))
      setLinkError(!data.session)
    }

    establishSession()
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 6) {
      setError(t('set_password_too_short'))
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(t('set_password_error'))
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/'), 1500)
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

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('set_password_title')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('set_password_prompt')}</p>

            {!ready && !linkError && (
              <p className="text-sm text-gray-500">...</p>
            )}

            {linkError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {t('set_password_error')}
              </div>
            )}

            {ready && !success && (
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    placeholder={t('new_password')}
                    className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 transition-all"
                >
                  {loading ? t('set_password_submitting') : t('set_password_submit')}
                </button>
              </form>
            )}

            {success && (
              <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                {t('set_password_success')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetPasswordPage() {
  return (
    <LanguageProvider>
      <Suspense fallback={null}>
        <SetPasswordForm />
      </Suspense>
    </LanguageProvider>
  )
}
