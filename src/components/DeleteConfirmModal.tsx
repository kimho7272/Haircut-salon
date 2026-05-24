'use client'

import { Calendar, Clock, User, Scissors, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { type AppointmentWithRelations } from '@/utils/supabaseService'

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  appointment: AppointmentWithRelations | null
  loading?: boolean
}

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  loading = false
}: DeleteConfirmModalProps) {
  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-red-200 bg-red-50">
          <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            예약 삭제 확인
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-red-600" />
          </button>
        </div>

        {/* 예약 정보 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium">다음 예약을 삭제하시겠습니까?</p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {/* 날짜와 시간 */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {format(new Date(appointment.appointment_date), 'yyyy년 M월 d일 (EEEE)', { locale: ko })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {appointment.appointment_time.slice(0, 5)}
              </span>
            </div>

            {/* 고객 정보 */}
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span>{appointment.customer?.name || '고객명 없음'}</span>
              {appointment.customer?.phone && (
                <span className="text-gray-500">({appointment.customer.phone})</span>
              )}
            </div>

            {/* 서비스 정보 */}
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-gray-500" />
              <span>{appointment.service?.name || '서비스명 없음'}</span>
              {appointment.service?.price && (
                <span className="text-gray-500">
                  - {appointment.service.price.toLocaleString()}원
                </span>
              )}
            </div>

            {/* 담당자 정보 */}
            {appointment.staff && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">직</span>
                </div>
                <span>{appointment.staff.name}</span>
              </div>
            )}

            {/* 메모 */}
            {appointment.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>메모:</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">
              ⚠️ 삭제된 예약은 복구할 수 없습니다.
            </p>
          </div>
        </div>

        {/* 버튼 */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>
    </div>
  )
}