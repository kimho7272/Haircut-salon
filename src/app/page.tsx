'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import SchedulePage from '@/components/SchedulePage'
import CustomerManagement from '@/components/CustomerManagement'
import ProtectedRoute from '@/components/ProtectedRoute'
import { LanguageProvider } from '@/contexts/LanguageContext'
import { AuthProvider } from '@/contexts/AuthContext'

export default function MainPage() {
  const [currentPage, setCurrentPage] = useState<'schedule' | 'customers'>('schedule')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <AuthProvider>
      <LanguageProvider>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Sidebar
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={setSidebarCollapsed}
            />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
              {currentPage === 'schedule' && <SchedulePage />}
              {currentPage === 'customers' && <CustomerManagement />}
            </div>
          </div>
        </ProtectedRoute>
      </LanguageProvider>
    </AuthProvider>
  )
}