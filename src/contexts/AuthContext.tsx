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
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user)
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