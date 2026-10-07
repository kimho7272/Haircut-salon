'use client'

import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { format, addDays } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { Scissors, Sparkles, Check, ChevronLeft, CheckCircle2, Clock, User } from 'lucide-react'
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext'
import LanguageSelector from '@/components/LanguageSelector'

type ServiceInfo = { id: string; name: string; price: number; duration: number; description?: string }
type StaffInfo = { id: string; name: string }
type Step = 'services' | 'staff' | 'datetime' | 'info' | 'done'

function BookingContent({ slug }: { slug: string }) {
  const { t, language, formatCurrency } = useLanguage()

  const [loadingInfo, setLoadingInfo] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [salonName, setSalonName] = useState('')
  const [services, setServices] = useState<ServiceInfo[]>([])
  const [staff, setStaff] = useState<StaffInfo[]>([])

  const [step, setStep] = useState<Step>('services')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/public-booking/info?slug=${encodeURIComponent(slug)}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(result => {
        setSalonName(result.salonName)
        setServices(result.services || [])
        setStaff(result.staff || [])
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoadingInfo(false))
  }, [slug])

  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.includes(s.id)),
    [services, selectedServiceIds]
  )
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0)
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0)

  const nextDays = useMemo(() => Array.from({ length: 14 }, (_, i) => addDays(new Date(), i)), [])

  useEffect(() => {
    if (step !== 'datetime' || totalDuration === 0) return
    setLoadingSlots(true)
    setSelectedTime(null)
    const params = new URLSearchParams({ slug, date: selectedDate, duration: String(totalDuration) })
    if (selectedStaffId) params.set('staffId', selectedStaffId)
    fetch(`/api/public-booking/availability?${params}`)
      .then(res => res.ok ? res.json() : { slots: [] })
      .then(result => setSlots(result.slots || []))
      .finally(() => setLoadingSlots(false))
  }, [step, slug, selectedDate, selectedStaffId, totalDuration])

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id])
  }

  const goToDatetime = () => {
    setStep(staff.length > 0 ? 'staff' : 'datetime')
  }

  const handleSubmit = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !selectedTime) {
      setError(t('book_error_required'))
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await fetch('/api/public-booking/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug,
          date: selectedDate,
          time: selectedTime,
          staffId: selectedStaffId,
          serviceIds: selectedServiceIds,
          customerName: customerName.trim(),
          customerPhone: customerPhone.trim(),
          customerEmail: customerEmail.trim() || undefined,
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error === 'slot_unavailable' ? t('book_error_slot_taken') : t('book_error_failed'))
        if (result.error === 'slot_unavailable') setStep('datetime')
        setSubmitting(false)
        return
      }
      setStep('done')
    } catch {
      setError(t('book_error_failed'))
      setSubmitting(false)
    }
  }

  const resetForNewBooking = () => {
    setSelectedServiceIds([])
    setSelectedStaffId(null)
    setSelectedTime(null)
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setError('')
    setStep('services')
  }

  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t('book_not_found_title')}</h1>
          <p className="text-gray-500">{t('book_not_found_message')}</p>
        </div>
      </div>
    )
  }

  const stepOrder: Step[] = staff.length > 0 ? ['services', 'staff', 'datetime', 'info'] : ['services', 'datetime', 'info']
  const stepIndex = stepOrder.indexOf(step)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 px-4 py-10 sm:py-14">
      <style dangerouslySetInnerHTML={{ __html: '.hide-scrollbar::-webkit-scrollbar{display:none}.hide-scrollbar{-ms-overflow-style:none;scrollbar-width:none}' }} />
      <div className="max-w-lg mx-auto">
        <div className="text-center mb-6">
          <div className="flex justify-center items-center gap-2 mb-3">
            <Sparkles className="h-6 w-6 text-pink-500" />
            <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-pink-500 shadow-lg">
              <Scissors className="h-6 w-6 text-white" />
            </div>
            <Sparkles className="h-6 w-6 text-purple-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{salonName}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('book_online_booking')}</p>
        </div>

        {step !== 'done' && (
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {stepOrder.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i <= stepIndex ? 'bg-purple-500 w-8' : 'bg-gray-300 w-5'
                }`}
              />
            ))}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8">
          {step === 'services' && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">{t('book_step_services')}</h2>
              {services.length === 0 ? (
                <p className="text-sm text-gray-500">{t('book_no_services')}</p>
              ) : (
                <>
                  <p className="text-sm text-gray-500">{t('book_select_services_prompt')}</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {services.map(service => {
                      const checked = selectedServiceIds.includes(service.id)
                      return (
                        <button
                          key={service.id}
                          type="button"
                          onClick={() => toggleService(service.id)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors ${
                            checked ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div>
                            <p className="font-medium text-gray-900">{service.name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{service.duration}{t('minutes')} · {formatCurrency(service.price)}</p>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                            checked ? 'bg-purple-500' : 'border border-gray-300'
                          }`}>
                            {checked && <Check className="w-3.5 h-3.5 text-white" />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </>
              )}

              {selectedServiceIds.length > 0 && (
                <div className="flex items-center justify-between text-sm text-gray-600 pt-2 border-t border-gray-100">
                  <span>{t('book_total_label')} {totalDuration}{t('minutes')}</span>
                  <span className="font-semibold text-gray-900">{formatCurrency(totalPrice)}</span>
                </div>
              )}

              <button
                type="button"
                disabled={selectedServiceIds.length === 0}
                onClick={goToDatetime}
                className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t('book_next')}
              </button>
            </div>
          )}

          {step === 'staff' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep('services')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-4 h-4" /> {t('book_back')}
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{t('book_step_staff')}</h2>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setSelectedStaffId(null)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                    selectedStaffId === null ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <User className="w-4 h-4 text-gray-400" />
                  <span className="font-medium text-gray-900">{t('book_any_staff')}</span>
                </button>
                {staff.map(member => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => setSelectedStaffId(member.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-colors ${
                      selectedStaffId === member.id ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="font-medium text-gray-900">{member.name}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setStep('datetime')}
                className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {t('book_next')}
              </button>
            </div>
          )}

          {step === 'datetime' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep(staff.length > 0 ? 'staff' : 'services')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-4 h-4" /> {t('book_back')}
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{t('book_step_datetime')}</h2>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">{t('book_select_date')}</p>
                <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
                  {nextDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const active = dateStr === selectedDate
                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedDate(dateStr)}
                        className={`shrink-0 flex flex-col items-center justify-center w-14 h-16 rounded-xl border text-sm transition-colors ${
                          active ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-xs">{format(day, 'EEE', { locale: language === 'ko' ? ko : enUS })}</span>
                        <span className="font-semibold">{format(day, 'd')}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-2">{t('book_select_time')}</p>
                {loadingSlots ? (
                  <p className="text-sm text-gray-400 py-4 text-center">{t('book_loading_slots')}</p>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-gray-400 py-4 text-center">{t('book_no_slots')}</p>
                ) : (
                  <div className="grid grid-cols-4 gap-2">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedTime(slot)}
                        className={`py-2 rounded-lg border text-sm transition-colors ${
                          selectedTime === slot ? 'border-purple-500 bg-purple-500 text-white' : 'border-gray-200 text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedTime}
                onClick={() => setStep('info')}
                className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                {t('book_next')}
              </button>
            </div>
          )}

          {step === 'info' && (
            <div className="space-y-4">
              <button type="button" onClick={() => setStep('datetime')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
                <ChevronLeft className="w-4 h-4" /> {t('book_back')}
              </button>
              <h2 className="text-lg font-semibold text-gray-900">{t('book_step_info')}</h2>

              <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
                <p className="font-medium text-gray-900 mb-1">{t('book_summary_title')}</p>
                <div className="flex justify-between text-gray-600">
                  <span>{t('book_summary_date')}</span>
                  <span>{format(new Date(`${selectedDate}T00:00:00`), language === 'ko' ? 'M월 d일 (EEE)' : 'MMM d (EEE)', { locale: language === 'ko' ? ko : enUS })}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('book_summary_time')}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selectedTime}</span>
                </div>
                {selectedStaffId && (
                  <div className="flex justify-between text-gray-600">
                    <span>{t('book_summary_staff')}</span>
                    <span>{staff.find(s => s.id === selectedStaffId)?.name}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>{t('book_summary_services')}</span>
                  <span className="text-right">{selectedServices.map(s => s.name).join(', ')}</span>
                </div>
                <div className="flex justify-between text-gray-900 font-semibold pt-1.5 border-t border-gray-200">
                  <span>{t('book_summary_total_price')}</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>

              <div className="space-y-3">
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder={`${t('book_customer_name')} (${t('required')})`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder={`${t('book_customer_phone')} (${t('required')})`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  placeholder={t('book_customer_email')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-60 transition-all"
              >
                {submitting ? t('book_submitting') : t('book_submit')}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">{t('book_success_title')}</h2>
              <p className="text-sm text-gray-500">{t('book_success_message')}</p>
              <button
                type="button"
                onClick={resetForNewBooking}
                className="w-full py-3 rounded-xl text-white font-medium bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 transition-all"
              >
                {t('book_success_new')}
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-center mt-4">
          <LanguageSelector isCollapsed={false} />
        </div>
      </div>
    </div>
  )
}

export default function PublicBookingPage() {
  const params = useParams()
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug

  return (
    <LanguageProvider>
      <BookingContent slug={slug || ''} />
    </LanguageProvider>
  )
}
