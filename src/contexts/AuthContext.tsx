'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { type User, type Session, type AuthChangeEvent } from '@supabase/supabase-js'
import { supabaseClient, getUserProfile, upsertUserProfile, type AuthUser } from '@/lib/supabase-auth'

interface AuthContextType {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser: User) => {
    try {
      let profile = await getUserProfile(authUser.id)

      if (!profile) {
        console.log('Profile not found, creating default profile...')
        // 프로필이 없으면 기본 프로필 생성 시도
        const defaultProfile = {
          user_id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'User',
          role: (authUser.email === 'admin@illyhair.com' ? 'admin' : 'staff') as 'admin' | 'staff'
        }

        const success = await upsertUserProfile(defaultProfile)
        if (success) {
          profile = await getUserProfile(authUser.id)
        }
      }

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email || '',
          name: profile.name,
          role: profile.role,
          phone: profile.phone
        })
      } else {
        console.error('Failed to create/load user profile')
        await supabaseClient.auth.signOut()
      }
    } catch (error) {
      console.error('Error loading user profile:', error)
      await supabaseClient.auth.signOut()
    }
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
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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