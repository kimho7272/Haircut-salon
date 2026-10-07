'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js'
import { supabaseClient, getUserProfile, type AuthUser } from '@/lib/supabase-auth'
import { setCurrentSalonId, getSalon, type Salon } from '@/utils/supabaseService'

interface AuthContextType {
  user: AuthUser | null
  salon: Salon | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
  refreshSalon: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [salon, setSalon] = useState<Salon | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 세션 관리를 위한 타이머 참조
  const keepAliveInterval = React.useRef<NodeJS.Timeout | undefined>(undefined)

  // loadUserProfile이 동시에 두 군데(초기 세션 체크 + onAuthStateChange 리스너)에서
  // 같은 세션에 대해 중복 실행되면 supabase-js 내부 상태가 꼬여서 이후의 모든 요청이
  // 영원히 멈춰버리는 문제가 실제로 있었음 (이미 세션이 있는 상태로 페이지가 열릴 때
  // 재현됨 — 둘 다 거의 동시에 트리거됨). 같은 user에 대해서는 한 번만 실행되게 막는다.
  const loadingProfileForUserId = React.useRef<string | null>(null)

  useEffect(() => {
    // 초기 세션 확인
    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()

        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeAuth()

    // 인증 상태 변경 리스너
    // 주의: 이 콜백 안에서 추가 supabase 호출(.from() 등)을 동기적으로 실행하면
    // supabase-js의 내부 auth lock(navigator.locks)이 재진입(reentrant) 상태에
    // 빠져 영원히 풀리지 않는 경우가 실제로 있었음 (supabase/auth-js#762와 동일 증상 —
    // 프로덕션 빌드에서 로그인된 상태로 새로고침만 해도 스피너가 영원히 멈추고
    // 네트워크 요청이 단 하나도 안 나감). setTimeout으로 다음 틱으로 미뤄서
    // 이 콜백의 동기 실행 스택(= lock을 쥐고 있는 구간)을 먼저 빠져나가게 한다.
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const signedInUser = session.user
        setTimeout(() => { loadUserProfile(signedInUser) }, 0)
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setSalon(null)
        setCurrentSalonId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // 세션 관리 useEffect
  useEffect(() => {
    if (!user) {
      // 로그아웃 상태면 타이머 정리
      if (keepAliveInterval.current) clearInterval(keepAliveInterval.current)
      return
    }

    // Keep-alive: 1분마다 세션 갱신으로 하루종일 유지
    keepAliveInterval.current = setInterval(async () => {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession()
        if (!session) {
          console.log('Keep-alive: 세션이 만료되었습니다')
          setUser(null)
        } else {
          console.log('Keep-alive: 세션 유지 중')
        }
      } catch (error) {
        console.error('Keep-alive 오류:', error)
      }
    }, 60 * 1000) // 1분

    return () => {
      // 클리어업
      if (keepAliveInterval.current) clearInterval(keepAliveInterval.current)
    }
  }, [user])

  const loadUserProfile = async (authUser: User) => {
    if (loadingProfileForUserId.current === authUser.id) {
      // 이미 같은 사용자에 대한 로딩이 진행 중 — 중복 호출은 조용히 무시
      return
    }
    loadingProfileForUserId.current = authUser.id

    try {
      const profile = await getUserProfile(authUser.id)

      // salon_id가 없는 프로필은 어느 미용실에도 속하지 않은 상태이므로
      // (멀티테넌트 전환 후에는 정상적인 가입/초대 흐름을 거치지 않은 경우) 로그인시킬 수 없음
      if (profile && profile.salon_id) {
        setCurrentSalonId(profile.salon_id)
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          salon_id: profile.salon_id,
          name: profile.name,
          role: profile.role,
          phone: profile.phone
        })
        setSalon(await getSalon())
      } else {
        console.error('Failed to load user profile or missing salon_id')
        setCurrentSalonId(null)
        await supabaseClient.auth.signOut()
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      setCurrentSalonId(null)
      await supabaseClient.auth.signOut()
    } finally {
      loadingProfileForUserId.current = null
    }
  }

  const refreshSalon = async () => {
    setSalon(await getSalon())
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        console.error('Login error:', error.message)
        return false
      }

      if (data.user) {
        await loadUserProfile(data.user)
        return true
      }

      return false
    } catch (error) {
      console.error('Login error:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await supabaseClient.auth.signOut()
      setUser(null)
      setSalon(null)
      setCurrentSalonId(null)
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, salon, login, logout, isLoading, refreshSalon }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}