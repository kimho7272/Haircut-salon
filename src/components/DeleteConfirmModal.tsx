'use client'

import { Calendar, Clock, User, Scissors, X } from 'lucide-react'
import { format } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { type AppointmentWithRelations } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { t, language, formatCurrency } = useLanguage()

  if (!isOpen || !appointment) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-red-200 bg-red-50">
          <h2 className="text-lg font-bold text-red-800 flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            {t('delete_appointment_confirm')}
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
          <p className="text-gray-700 font-medium">{t('delete_appointment_question')}</p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            {/* 날짜와 시간 */}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {format(new Date(appointment.appointment_date), language === 'ko' ? 'yyyy년 M월 d일 (EEEE)' : 'EEEE, MMM d, yyyy', { locale: language === 'ko' ? ko : enUS })}
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
              <span>{appointment.customer?.name || t('customer_name_unknown')}</span>
              {appointment.customer?.phone && (
                <span className="text-gray-500">({appointment.customer.phone})</span>
              )}
            </div>

            {/* 서비스 정보 */}
            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-gray-500" />
              <span>{appointment.service?.name || t('service_name_unknown')}</span>
              {appointment.service?.price && (
                <span className="text-gray-500">
                  - {formatCurrency(appointment.service.price)}
                </span>
              )}
            </div>

            {/* 담당자 정보 */}
            {appointment.staff && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{t('staff_abbreviation')}</span>
                </div>
                <span>{appointment.staff.name}</span>
              </div>
            )}

            {/* 메모 */}
            {appointment.notes && (
              <div className="pt-2 border-t border-gray-200">
                <p className="text-sm text-gray-600">
                  <strong>{t('memo_label_colon')}</strong> {appointment.notes}
                </p>
              </div>
            )}
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-red-700 text-sm">
              ⚠️ {t('delete_warning')}
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
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('deleting') : t('delete')}
          </button>
        </div>
      </div>
    </div>
  )
}