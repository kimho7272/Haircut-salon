'use client'

import { Calendar, Clock, User, Scissors, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { type AppointmentWithRelations } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'

interface DuplicateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  existingAppointment: AppointmentWithRelations | null
  loading?: boolean
}

export default function DuplicateAppointmentModal({
  isOpen,
  onClose,
  onConfirm,
  existingAppointment,
  loading = false
}: DuplicateAppointmentModalProps) {
  const { t, language } = useLanguage()

  if (!isOpen || !existingAppointment) return null

  return (
    <div
      className="fixed inset-0 z-70 overflow-y-auto flex items-center justify-center p-4"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'none'
      }}
    >
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
        {/* 헤더 */}
        <div className="flex items-center justify-between py-2 px-4 border-b border-yellow-200 bg-yellow-50">
          <h2 className="text-lg font-bold text-yellow-800 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            {t('duplicate_appointment_title')}
          </h2>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700 font-medium">{t('duplicate_appointment_question')}</p>

          <div className="bg-gray-50 rounded-lg p-4 space-y-3">
            <div className="text-xs text-gray-500">{t('duplicate_appointment_existing_label')}</div>

            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {format(parseISO(existingAppointment.appointment_date), language === 'ko' ? 'yyyy년 M월 d일 (EEEE)' : 'EEEE, MMM d, yyyy', { locale: language === 'ko' ? ko : enUS })}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium">
                {existingAppointment.appointment_time.slice(0, 5)}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-500" />
              <span>{existingAppointment.customer?.name || t('customer_name_unknown')}</span>
              {existingAppointment.customer?.phone && (
                <span className="text-gray-500">({existingAppointment.customer.phone})</span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Scissors className="w-4 h-4 text-gray-500" />
              <span>
                {existingAppointment.services && existingAppointment.services.length > 0
                  ? existingAppointment.services.map(service => service.name).join(', ')
                  : t('service_name_unknown')}
              </span>
            </div>

            {existingAppointment.staff && (
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 bg-gray-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">{t('staff_abbreviation')}</span>
                </div>
                <span>{existingAppointment.staff.name}</span>
              </div>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-yellow-700 text-sm">
              ⚠️ {t('duplicate_appointment_question')}
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
            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {loading ? t('saving') : t('book_anyway')}
          </button>
        </div>
      </div>
    </div>
  )
}
