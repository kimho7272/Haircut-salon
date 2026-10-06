'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import SchedulePage from '@/components/SchedulePage'
import CustomerManagement from '@/components/CustomerManagement'
import ServiceManagement from '@/components/ServiceManagement'
import StaffManagement from '@/components/StaffManagement'
import RevenueManagement from '@/components/RevenueManagement'

// 로그인된 사용자에게 보여주는 실제 앱 화면. 인증 여부 확인은 호출하는 쪽(각 라우트의
// 게이트 컴포넌트)에서 이미 끝낸 상태라고 가정함 — 여기서는 따로 체크하지 않음.
export default function AppShell() {
  const [currentPage, setCurrentPage] = useState<'schedule' | 'customers' | 'services' | 'staff' | 'revenue'>('schedule')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="bg-gray-50">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={setSidebarCollapsed}
      />

      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-16' : 'ml-52'}`}>
        {currentPage === 'schedule' && <SchedulePage />}
        {currentPage === 'customers' && <CustomerManagement />}
        {currentPage === 'services' && <ServiceManagement />}
        {currentPage === 'staff' && <StaffManagement />}
        {currentPage === 'revenue' && <RevenueManagement />}
      </div>
    </div>
  )
}
