'use client'

import { User, Phone, Mail, FileText } from 'lucide-react'
import { type Customer } from '@/lib/supabase'

interface DuplicateCustomerModalProps {
  isOpen: boolean
  onClose: () => void
  newCustomerData: {
    name: string
    phone?: string
    email?: string
    notes?: string
  }
  existingCustomers: Customer[]
  onUseExisting: (customer: Customer) => void
  onReEnterInfo: () => void
}

export default function DuplicateCustomerModal({
  isOpen,
  onClose,
  newCustomerData,
  existingCustomers,
  onUseExisting,
  onReEnterInfo
}: DuplicateCustomerModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'none'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-yellow-200 bg-yellow-50">
          <h2 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-600" />
            유사한 고객 정보 발견
          </h2>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">입력하신 고객 정보:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{newCustomerData.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-600" />
                <span>{newCustomerData.phone || '전화번호 없음'}</span>
              </div>
              {newCustomerData.email && (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span>{newCustomerData.email}</span>
                </div>
              )}
              {newCustomerData.notes && (
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{newCustomerData.notes}</span>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-medium text-gray-800 mb-3">
              기존에 등록된 고객:
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {existingCustomers.map((customer, index) => (
                <div
                  key={customer.id}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 text-sm flex-1">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-600" />
                        <span className="font-medium">{customer.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-gray-600" />
                        <span>{customer.phone || '전화번호 없음'}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-gray-600" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                      {customer.notes && (
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-gray-600" />
                          <span className="truncate">{customer.notes}</span>
                        </div>
                      )}
                      <div className="text-xs text-gray-500">
                        등록일: {new Date(customer.created_at).toLocaleDateString('ko-KR')}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onUseExisting(customer)}
                      className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      이 고객 선택
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-yellow-700 text-sm mb-3">
              <strong>⚠️ 동일한 이름+전화번호 조합의 고객이 이미 존재합니다</strong>
            </p>
            <ul className="text-yellow-700 text-sm space-y-1">
              <li>• <strong>기존 고객 선택:</strong> 위의 고객 중 하나를 선택하여 예약을 생성합니다</li>
              <li>• <strong>정보 다시 입력:</strong> 다른 전화번호나 정보로 다시 입력하세요</li>
            </ul>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onReEnterInfo}
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            정보 다시 입력
          </button>
        </div>
      </div>
    </div>
  )
}