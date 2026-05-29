'use client'

import { useState } from 'react'
import { Calendar, Users, Settings, UserCog, DollarSign, Menu, X, LogOut } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import LogoutConfirmModal from '@/components/LogoutConfirmModal'

interface SidebarProps {
  currentPage: 'schedule' | 'customers' | 'services' | 'staff' | 'revenue'
  onPageChange: (page: 'schedule' | 'customers' | 'services' | 'staff' | 'revenue') => void
  isCollapsed: boolean
  onToggleCollapse: (collapsed: boolean) => void
}

export default function Sidebar({ currentPage, onPageChange, isCollapsed, onToggleCollapse }: SidebarProps) {
  const { t, language, setLanguage } = useLanguage()
  const { user, logout } = useAuth()
  const [showLogoutModal, setShowLogoutModal] = useState(false)

  const baseMenuItems = [
    {
      id: 'schedule' as const,
      label: t('schedule_management'),
      icon: Calendar,
      active: currentPage === 'schedule'
    },
    {
      id: 'customers' as const,
      label: t('customer_management'),
      icon: Users,
      active: currentPage === 'customers'
    }
  ]

  const adminMenuItems = [
    {
      id: 'services' as const,
      label: t('service_management'),
      icon: Settings,
      active: currentPage === 'services'
    },
    {
      id: 'staff' as const,
      label: t('staff_management'),
      icon: UserCog,
      active: currentPage === 'staff'
    },
    {
      id: 'revenue' as const,
      label: t('revenue_management'),
      icon: DollarSign,
      active: currentPage === 'revenue'
    }
  ]

  const menuItems = user?.role === 'admin'
    ? [...baseMenuItems, ...adminMenuItems]
    : baseMenuItems

  return (
    <>
      {/* 모바일용 오버레이 */}
      {!isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => onToggleCollapse(true)}
        />
      )}

      {/* 사이드바 */}
      <div className={`
        fixed left-0 top-0 h-full bg-white shadow-lg z-50 transition-all duration-300 border-r border-gray-200
        ${isCollapsed ? 'w-16' : 'w-52'}
      `}>
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-gray-900">
                  {t('salon_name')}
                </h1>
                <p className="text-sm text-gray-600">{t('management_system')}</p>
              </div>
            )}
            <button
              onClick={() => onToggleCollapse(!isCollapsed)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 메뉴 리스트 */}
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={`
                  w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  ${item.active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-700 hover:bg-gray-100'
                  }
                  ${isCollapsed ? 'justify-center' : ''}
                `}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="font-medium">{item.label}</span>
                )}
              </button>
            )
          })}
        </nav>

        {/* 사용자 정보 및 설정 */}
        <div className="absolute bottom-4 left-4 right-4 space-y-3">
          {/* 언어 토글 */}
          {!isCollapsed ? (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-gray-600">언어 / Language</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs transition-colors ${language === 'ko' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  한국어
                </span>
                <button
                  onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                  className="relative w-10 h-5 bg-gray-200 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  style={{ backgroundColor: language === 'en' ? '#3B82F6' : '#E5E7EB' }}
                  title="언어 변경 / Change Language"
                >
                  <div
                    className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                    style={{ transform: language === 'en' ? 'translateX(20px)' : 'translateX(2px)' }}
                  />
                </button>
                <span className={`text-xs transition-colors ${language === 'en' ? 'text-blue-600 font-medium' : 'text-gray-400'}`}>
                  English
                </span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="w-full flex items-center justify-center p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title={`언어 변경 / Change Language (${language === 'ko' ? 'KO' : 'EN'})`}
            >
              🌐
            </button>
          )}

          {/* 사용자 정보 */}
          {!isCollapsed && user && (
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="text-sm font-medium text-gray-900">{user.name}</div>
              <div className="text-xs text-gray-500 capitalize">{user.role}</div>
            </div>
          )}

          {/* 로그아웃 버튼 */}
          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-red-50 hover:text-red-700 rounded-lg transition-colors ${
              isCollapsed ? 'justify-center' : ''
            }`}
            title={isCollapsed ? t('logout') : ''}
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span className="text-sm">{t('logout')}</span>}
          </button>
        </div>
      </div>

      {/* 로그아웃 확인 모달 */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={() => {
          logout()
          setShowLogoutModal(false)
        }}
      />
    </>
  )
}