'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Sparkles, Store, User, Mail, Lock, Eye, EyeOff, Link2, Star, Check } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'
import { supabase } from '@/lib/supabase'

function SignupForm() {
  const { t } = useLanguage()
  const router = useRouter()

  const [formData, setFormData] = useState({
    salonName: '',
    adminName: '',
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 미용실 이름을 입력하는 동안 실시간으로 보여주는 slug 미리보기
  // (실제 가입 때와 동일한 resolveAvailableSlug를 서버에서 호출하므로 결과가 항상 일치함)
  const [slugPreview, setSlugPreview] = useState('')
  const [checkingSlug, setCheckingSlug] = useState(false)
  const slugCheckTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const [finalSlug, setFinalSlug] = useState<string | null>(null)
  const [bookmarkCopied, setBookmarkCopied] = useState(false)

  useEffect(() => {
    const name = formData.salonName.trim()
    clearTimeout(slugCheckTimer.current)

    if (!name) {
      setSlugPreview('')
      setCheckingSlug(false)
      return
    }

    setCheckingSlug(true)
    slugCheckTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/check-slug?name=${encodeURIComponent(name)}`)
        if (response.ok) {
          const result = await response.json()
          setSlugPreview(result.slug)
        }
      } finally {
        setCheckingSlug(false)
      }
    }, 400)

    return () => clearTimeout(slugCheckTimer.current)
  }, [formData.salonName])

  const siteOrigin = typeof window !== 'undefined' ? window.location.origin : ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.salonName.trim() || !formData.adminName.trim() || !formData.email.trim() || formData.password.length < 6) {
      setError(t('signup_error_invalid'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'email_taken') {
          setError(t('signup_error_email_taken'))
        } else {
          setError(t('signup_error_generic'))
        }
        setLoading(false)
        return
      }

      // 가입 성공 - 바로 로그인 처리 (AuthContext의 onAuthStateChange가 세션을 감지함)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (signInError) {
        // 가입은 됐지만 자동 로그인만 실패한 경우 — 로그인 페이지로 보냄
        router.push('/')
        return
      }

      // 바로 넘어가지 않고 확정된 주소를 보여주며 즐겨찾기 등록을 안내
      setFinalSlug(result.slug)
      setLoading(false)
    } catch (err) {
      setError(t('signup_error_generic'))
      setLoading(false)
    }
  }

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toLowerCase().includes('mac')
  const bookmarkShortcut = isMac ? '⌘+D' : 'Ctrl+D'

  const handleAddBookmark = async () => {
    const url = `${siteOrigin}/${finalSlug}`
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // 클립보드 접근 실패해도 안내 문구와 주소는 화면에 보이므로 수동 복사 가능
    }
    setBookmarkCopied(true)

    // 표준 웹에는 "즐겨찾기 추가" API가 없음 — 과거 IE/Firefox 전용 API가 남아있는
    // 극히 일부 환경을 위한 안전한 폴백 시도 (대부분의 최신 브라우저에서는 조용히 무시됨)
    const win = window as unknown as {
      sidebar?: { addPanel: (title: string, url: string, customData: string) => void }
      external?: { AddFavorite?: (url: string, title: string) => void }
    }
    try {
      if (win.sidebar?.addPanel) {
        win.sidebar.addPanel(document.title, url, '')
      } else if (win.external?.AddFavorite) {
        win.external.AddFavorite(url, document.title)
      }
    } catch {
      // 레거시 API가 없거나 차단된 경우 — 위 클립보드 복사 + 안내 문구로 충분함
    }
  }

  if (finalSlug) {
    const fullUrl = `${siteOrigin}/${finalSlug}`
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="text-center mb-6">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg mb-4">
              <Check className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">{t('signup_success_title')}</h1>
            <p className="text-gray-600">{t('signup_success_subtitle')}</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 space-y-5">
            <div className="flex items-center gap-2 px-4 py-3 bg-purple-50 border border-purple-200 rounded-lg">
              <Link2 className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="text-sm font-medium text-purple-900 break-all">{fullUrl}</span>
            </div>

            <div>
              <button
                type="button"
                onClick={handleAddBookmark}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                <Star className={`w-4 h-4 ${bookmarkCopied ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                {t('signup_add_bookmark')}
              </button>
              {bookmarkCopied && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  {t('signup_bookmark_instruction').replace('{shortcut}', bookmarkShortcut)}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full flex justify-center py-3 px-4 rounded-lg text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
            >
              {t('signup_continue_to_dashboard')}
            </button>
          </div>
        </div>
      </div>
    )
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
            {t('product_name')}
          </h1>
          <p className="text-gray-600 mb-6">{t('product_tagline')}</p>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {t('signup_pitch_title')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {t('signup_pitch_body')}
            </p>

            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder={t('signup_salon_name_placeholder')}
                  aria-label={t('signup_salon_name_label')}
                  className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.salonName}
                  onChange={(e) => setFormData(prev => ({ ...prev, salonName: e.target.value }))}
                />
              </div>

              {formData.salonName.trim() && (
                <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 border border-purple-100 rounded-lg text-xs">
                  <Link2 className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  <span className="text-purple-700 font-medium shrink-0">{t('signup_url_preview_label')}</span>
                  <span className="text-purple-900 truncate">
                    {checkingSlug
                      ? t('signup_url_checking')
                      : `${siteOrigin}/${slugPreview}`}
                  </span>
                </div>
              )}

              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  required
                  placeholder={t('signup_admin_name_label')}
                  className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.adminName}
                  onChange={(e) => setFormData(prev => ({ ...prev, adminName: e.target.value }))}
                />
              </div>

              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder={t('email')}
                  className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  placeholder={t('password')}
                  className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm pr-12"
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
                {loading ? t('signup_submitting') : t('signup_submit')}
              </button>

              <p className="text-center text-sm text-gray-600">
                {t('signup_have_account')}{' '}
                <a href="/" className="text-purple-600 hover:text-purple-700 font-medium">
                  {t('signup_go_login')}
                </a>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignupPage() {
  return (
    <LanguageProvider>
      <SignupForm />
    </LanguageProvider>
  )
}
