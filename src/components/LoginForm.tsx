'use client'

import { useState } from 'react'
import { Lock, User, Eye, EyeOff, Scissors, Sparkles } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

export default function LoginForm() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const salonName = process.env.NEXT_PUBLIC_SALON_NAME || 'Hair Salon'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.email || !formData.password) {
      setError(t('login_error_empty'))
      return
    }

    setLoading(true)
    setError('')

    try {
      const success = await login(formData.email, formData.password)
      if (!success) {
        setError(t('login_error_invalid'))
      }
    } catch (error) {
      setError(t('login_error_failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Beautiful Banner */}
        <div className="text-center">
          <div className="relative">
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
              {salonName}
            </h2>
            <div className="flex justify-center space-x-1 mb-6">
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
              <div className="h-1 w-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded"></div>
              <div className="h-1 w-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded"></div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
            <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-100 to-purple-100 mb-4">
              <Lock className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t('sign_in_to_account')}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {salonName} {t('management_system')}
            </p>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="rounded-md shadow-sm space-y-4">
                <div>
                  <label htmlFor="email" className="sr-only">
                    Email
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                      placeholder={t('email')}
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="sr-only">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      className="appearance-none rounded-lg relative block w-full px-12 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm pr-12"
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
              </div>

              {/* 언어 선택기 */}
              <div className="flex justify-end">
                <LanguageSelector isCollapsed={false} />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {loading ? t('signing_in') : t('sign_in')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}