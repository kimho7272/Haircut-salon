'use client'

import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

interface AdminSessionContextType {
  session: Session
}

export const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined)

export function useAdminSession() {
  const ctx = useContext(AdminSessionContext)
  if (!ctx) {
    throw new Error('useAdminSession must be used within the admin layout')
  }
  return ctx
}
