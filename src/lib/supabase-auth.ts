import { createClient } from '@supabase/supabase-js'

// 클라이언트 사이드 Supabase 클라이언트 (세션 기반 저장소 사용)
export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      storageKey: 'haircut-auth',
      storage: {
        getItem: (key: string) => {
          if (typeof window !== 'undefined') {
            return sessionStorage.getItem(key)
          }
          return null
        },
        setItem: (key: string, value: string) => {
          if (typeof window !== 'undefined') {
            sessionStorage.setItem(key, value)
          }
        },
        removeItem: (key: string) => {
          if (typeof window !== 'undefined') {
            sessionStorage.removeItem(key)
          }
        }
      }
    }
  }
)

// 사용자 프로필 타입 정의
export interface UserProfile {
  id: string
  user_id: string
  name: string
  role: 'admin' | 'staff'
  phone?: string
  created_at: string
  updated_at: string
}

// 확장된 사용자 정보 타입
export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'staff'
  phone?: string
}

// 사용자 프로필 가져오기
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  console.log('Fetching profile for user ID:', userId)

  const { data, error } = await supabaseClient
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .limit(1)

  console.log('Profile query result:', { data, error })

  if (error) {
    console.error('Error fetching user profile:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint
    })
    return null
  }

  // 배열에서 첫 번째 항목 반환, 없으면 null
  return data && data.length > 0 ? data[0] : null
}

// 사용자 프로필 생성/업데이트
export const upsertUserProfile = async (profile: Partial<UserProfile>): Promise<boolean> => {
  const { error } = await supabaseClient
    .from('user_profiles')
    .upsert(profile)

  if (error) {
    console.error('Error upserting user profile:', error)
    return false
  }

  return true
}