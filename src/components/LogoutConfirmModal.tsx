'use client'

import { LogOut, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface LogoutConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
}

export default function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const { t } = useLanguage()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-orange-200 bg-orange-50">
          <h2 className="text-lg font-bold text-orange-800 flex items-center gap-2">
            <LogOut className="w-5 h-5" />
            {t('logout_confirm_title')}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-orange-600" />
          </button>
        </div>

        {/* 콘텐츠 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium">{t('logout_confirm_message')}</p>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('logout')}
          </button>
        </div>
      </div>
    </div>
  )
}