'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoginForm from '@/components/LoginForm'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'

// 루트 도메인은 "로그인 창"일 뿐이다. 관리자가 처음 미용실을 만드는 가입 과정
// 때문에만 루트에서의 로그인을 허용하고, 로그인에 성공하면 곧바로 자기 미용실의
// 경로(/<slug>)로 보낸다 — 앱 자체는 거기서만 렌더링됨 (AppShell 참고).
function RootGate() {
  const { user, salon, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user && salon) {
      router.replace(`/${salon.slug}`)
    }
  }, [isLoading, user, salon, router])

  if (isLoading || (user && salon)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  return <LoginForm />
}

export default function RootPage() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <RootGate />
      </LanguageProvider>
    </AuthProvider>
  )
}
