'use client'

import { AlertCircle, X, Phone, User } from 'lucide-react'

interface ErrorModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  type?: 'error' | 'warning' | 'info'
  details?: string
}

export default function ErrorModal({
  isOpen,
  onClose,
  title,
  message,
  type = 'error',
  details
}: ErrorModalProps) {
  if (!isOpen) return null

  const getColorClasses = () => {
    switch (type) {
      case 'warning':
        return {
          headerBg: 'bg-yellow-50',
          headerBorder: 'border-yellow-200',
          headerText: 'text-yellow-800',
          iconColor: 'text-yellow-600',
          accent: 'bg-yellow-50 border-yellow-200',
          accentText: 'text-yellow-700',
          button: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'info':
        return {
          headerBg: 'bg-blue-50',
          headerBorder: 'border-blue-200',
          headerText: 'text-blue-800',
          iconColor: 'text-blue-600',
          accent: 'bg-blue-50 border-blue-200',
          accentText: 'text-blue-700',
          button: 'bg-blue-600 hover:bg-blue-700'
        }
      default: // error
        return {
          headerBg: 'bg-red-50',
          headerBorder: 'border-red-200',
          headerText: 'text-red-800',
          iconColor: 'text-red-600',
          accent: 'bg-red-50 border-red-200',
          accentText: 'text-red-700',
          button: 'bg-red-600 hover:bg-red-700'
        }
    }
  }

  const colors = getColorClasses()

  return (
    <div
      className="fixed inset-0 z-60 overflow-y-auto flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'none'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full animate-in fade-in duration-200">
        {/* 헤더 */}
        <div className={`flex items-center justify-between py-2 px-4 border-b ${colors.headerBorder} ${colors.headerBg}`}>
          <h2 className={`text-lg font-bold ${colors.headerText} flex items-center gap-2`}>
            <AlertCircle className={`w-5 h-5 ${colors.iconColor}`} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className={`p-1 hover:${colors.headerBg} rounded-lg transition-colors`}
          >
            <X className={`w-5 h-5 ${colors.iconColor}`} />
          </button>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium leading-relaxed">
            {message}
          </p>

          {details && (
            <div className={`${colors.accent} border rounded-lg p-4`}>
              <p className={`text-sm ${colors.accentText} leading-relaxed`}>
                {details}
              </p>
            </div>
          )}

          {/* 고객 정보 중복 에러인 경우 도움말 추가 */}
          {(title.includes('전화번호') || title.includes('고객 정보')) && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-1">💡 도움말</p>
                  <p>• 전화번호는 선택사항입니다</p>
                  <p>• 같은 이름이라도 전화번호가 다르면 등록 가능합니다</p>
                  <p>• 동일한 이름+전화번호 조합은 중복될 수 없습니다</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 버튼 */}
        <div className="flex justify-end gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-6 py-3 ${colors.button} text-white rounded-lg transition-colors font-medium`}
          >
            확인
          </button>
        </div>
      </div>
    </div>
  )
}

// 전화번호 중복 에러를 위한 헬퍼 함수 (기존 호환성)
export function createPhoneErrorModal(phoneNumber: string, existingCustomerName?: string) {
  return {
    title: '전화번호 중복 오류',
    message: `이미 등록된 전화번호입니다.`,
    details: existingCustomerName
      ? `전화번호 "${phoneNumber}"는 고객 "${existingCustomerName}"님이 사용 중입니다.`
      : `전화번호 "${phoneNumber}"는 이미 다른 고객이 사용 중입니다.`,
    type: 'error' as const
  }
}

// 이름+전화번호 조합 중복 에러를 위한 헬퍼 함수
export function createNamePhoneErrorModal(name: string, phone: string, existingCustomer?: any) {
  const phoneDisplay = phone ? `(${phone})` : '(전화번호 없음)'

  return {
    title: '고객 정보 중복 오류',
    message: `이미 등록된 고객 정보입니다.`,
    details: `"${name}" ${phoneDisplay} 조합의 고객이 이미 존재합니다.`,
    type: 'error' as const
  }
}

// 일반 에러를 위한 헬퍼 함수
export function createGeneralErrorModal(message: string, details?: string) {
  return {
    title: '오류가 발생했습니다',
    message,
    details,
    type: 'error' as const
  }
}