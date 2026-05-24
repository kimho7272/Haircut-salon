'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Phone, Calendar, Clock, Scissors, CreditCard, Search } from 'lucide-react'
import { format } from 'date-fns'
import { ko } from 'date-fns/locale'
import { getServices, getStaff, getCustomers, saveCustomer, saveAppointment, updateAppointment, type AppointmentWithRelations } from '@/utils/supabaseService'
import { type Service, type Staff, type Customer } from '@/lib/supabase'

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (appointment: AppointmentWithRelations | null) => void
  selectedDate: Date
  appointment?: AppointmentWithRelations | null
  mode: 'add' | 'edit'
  initialTime?: string | null
}

export default function AppointmentModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  appointment = null,
  mode = 'add',
  initialTime = null
}: AppointmentModalProps) {
  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    service_id: '',
    appointment_time: '10:00',
    notes: ''
  })

  // 시간 선택을 위한 별도 상태
  const [selectedHour, setSelectedHour] = useState('10')
  const [selectedMinute, setSelectedMinute] = useState('00')

  // 날짜 선택을 위한 상태
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(
    format(selectedDate, 'yyyy-MM-dd')
  )
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date(selectedAppointmentDate))

  // 외부 클릭시 캘린더 닫기를 위한 ref
  const calendarRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCustomCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // 커스텀 달력 함수들
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 이전 달의 날짜들
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const prevDate = new Date(year, month, -i)
      days.push({ date: prevDate, isCurrentMonth: false })
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ date: new Date(year, month, day), isCurrentMonth: true })
    }

    // 다음 달의 날짜들 (42개 칸 맞추기)
    const remainingDays = 42 - days.length
    for (let day = 1; day <= remainingDays; day++) {
      days.push({ date: new Date(year, month + 1, day), isCurrentMonth: false })
    }

    return days
  }

  const handleDateSelect = (date: Date) => {
    setSelectedAppointmentDate(format(date, 'yyyy-MM-dd'))
    setShowCustomCalendar(false)
  }

  const goToPrevMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))
  }

  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchCustomer, setSearchCustomer] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  // 타입 안전성을 위한 추가 체크
  const selectedService = services?.find((s: Service) => s.id === formData.service_id)
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchData()
      // 새 예약 추가 모드일 때 초기값 설정
      if (mode === 'add') {
        setSelectedAppointmentDate(format(selectedDate, 'yyyy-MM-dd'))
        resetForm()
      }
    }
  }, [isOpen, mode, selectedDate])

  // 시/분이 변경될 때마다 appointment_time 업데이트
  useEffect(() => {
    updateAppointmentTime(selectedHour, selectedMinute)
  }, [selectedHour, selectedMinute])

  // 초기 시간 설정을 위한 별도 useEffect
  useEffect(() => {
    if (isOpen && mode === 'add' && initialTime) {
      const [hour, minute] = initialTime.split(':')
      setSelectedHour(hour)
      setSelectedMinute(minute)
      setFormData(prev => ({
        ...prev,
        appointment_time: initialTime
      }))
    }
  }, [isOpen, mode, initialTime])

  // 고객 데이터 로딩 완료 후 예약 데이터 설정
  useEffect(() => {
    if (isOpen && appointment && mode === 'edit' && customers.length > 0) {
      // 기존 고객이 고객 목록에 있는지 확인
      const existingCustomer = customers.find(c => c.id === appointment.customer_id)

      const appointmentTime = appointment.appointment_time.slice(0, 5)
      const [hour, minute] = appointmentTime.split(':')

      setSelectedHour(hour)
      setSelectedMinute(minute)
      setSelectedAppointmentDate(appointment.appointment_date)

      setFormData({
        customer_id: appointment.customer_id,
        staff_id: appointment.staff_id,
        service_id: appointment.service_id,
        appointment_time: appointmentTime,
        notes: appointment.notes || ''
      })

      // 고객명을 검색 필드에 표시
      setSearchCustomer(existingCustomer?.name || appointment.customer?.name || '')
    }
  }, [isOpen, appointment, mode, customers])

  const fetchData = async () => {
    try {
      // 병렬로 모든 데이터 가져오기
      const [customersData, servicesData, staffData] = await Promise.all([
        getCustomers(),
        getServices(),
        getStaff()
      ])

      setCustomers(customersData)
      setServices(servicesData)
      setStaff(staffData)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    customer.phone.includes(searchCustomer)
  )

  // 시간 옵션 생성 함수들
  const generateHourOptions = () => {
    const options = []
    for (let hour = 9; hour <= 19; hour++) {
      options.push({
        value: hour.toString(),
        label: `${hour}시`
      })
    }
    return options
  }

  const generateMinuteOptions = () => {
    const options = []
    for (let minute = 0; minute <= 50; minute += 10) {
      const minuteStr = minute.toString().padStart(2, '0')
      options.push({
        value: minuteStr,
        label: `${minute}분`
      })
    }
    return options
  }

  // 시/분이 변경될 때마다 appointment_time 업데이트
  const updateAppointmentTime = (hour: string, minute: string) => {
    const timeValue = `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`
    setFormData(prev => ({ ...prev, appointment_time: timeValue }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      let customerId = formData.customer_id

      // 새 고객 등록 처리
      if (showNewCustomer) {
        const newCustomerData = await saveCustomer({
          name: newCustomer.name,
          phone: newCustomer.phone || '',
          email: newCustomer.email || undefined,
          notes: newCustomer.notes || undefined
        })
        customerId = newCustomerData.id
      } else if (!customerId) {
        throw new Error('고객을 선택해주세요.')
      }

      // 직원 정보 확인 (선택사항)
      const selectedStaff = formData.staff_id ? staff.find(s => s.id === formData.staff_id) : null

      // 서비스 정보 확인
      const selectedService = services.find(s => s.id === formData.service_id)
      if (!selectedService) {
        throw new Error('서비스를 선택해주세요.')
      }

      const appointmentData = {
        customer_id: customerId,
        staff_id: selectedStaff?.id || null,
        service_id: selectedService.id,
        appointment_date: selectedAppointmentDate,
        appointment_time: formData.appointment_time,
        duration: selectedService.duration,
        notes: formData.notes,
        status: 'scheduled' as const
      }

      let result: AppointmentWithRelations
      if (mode === 'edit' && appointment) {
        // 수정
        const updated = await updateAppointment(appointment.id, appointmentData)
        if (!updated) {
          throw new Error('예약 수정에 실패했습니다.')
        }
        result = updated
      } else {
        // 새로 추가
        result = await saveAppointment(appointmentData)
      }

      onSave(result)

      // 새 고객이 추가된 경우 고객 목록 새로고침
      if (showNewCustomer && newCustomer.name) {
        await fetchData()
      }

      onClose()
      resetForm()
    } catch (error: any) {
      console.error('예약 저장 실패:', error)
      alert(error.message || '예약 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }


  const resetForm = () => {
    setFormData({
      customer_id: '',
      staff_id: '',
      service_id: '',
      appointment_time: '10:00',
      notes: ''
    })
    setSelectedHour('10')
    setSelectedMinute('00')
    setSelectedAppointmentDate(format(selectedDate, 'yyyy-MM-dd'))
    setSearchCustomer('')
    setShowNewCustomer(false)
    setNewCustomer({ name: '', phone: '', email: '', notes: '' })
  }


  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'edit' ? '예약 수정' : '새 예약 추가'}
          </h2>
          <button
            onClick={() => {
              resetForm()
              onClose()
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 고객 선택/추가 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              고객 정보
            </label>

            {!showNewCustomer ? (
              <div className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="고객명 또는 전화번호 검색..."
                    value={searchCustomer}
                    onChange={(e) => setSearchCustomer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredCustomers.length > 0) {
                        e.preventDefault()
                        const firstCustomer = filteredCustomers[0]
                        setFormData(prev => ({ ...prev, customer_id: firstCustomer.id }))
                        setSearchCustomer(firstCustomer.name)
                      }
                    }}
                    className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>

                {searchCustomer && (
                  <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(customer => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, customer_id: customer.id }))
                            setSearchCustomer(customer.name)
                          }}
                          className={`w-full p-3 text-left hover:bg-gray-50 border-b last:border-b-0 ${
                            formData.customer_id === customer.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="font-medium">{customer.name}</div>
                          <div className="text-sm text-gray-500">{customer.phone}</div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-gray-500 text-center">
                        고객을 찾을 수 없습니다.
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  + 새 고객 등록
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">새 고객 정보</h4>
                  <button
                    type="button"
                    onClick={() => setShowNewCustomer(false)}
                    className="text-sm text-gray-500 hover:text-gray-700"
                  >
                    취소
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="고객명"
                    value={newCustomer.name}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="전화번호 (선택)"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="email"
                    placeholder="이메일 (선택)"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="특이사항 (선택)"
                    value={newCustomer.notes}
                    onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* 날짜 및 시간 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              예약 날짜 및 시간
            </label>
            <div className="flex gap-3">
              {/* 날짜 선택 - 전체의 50% */}
              <div className="flex-[2] relative" ref={calendarRef}>
                <label className="block text-xs text-gray-500 mb-1">날짜</label>
                <button
                  type="button"
                  onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                  className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 relative flex items-center"
                >
                  {selectedAppointmentDate || '날짜 선택'}
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </button>

                {/* 커스텀 달력 */}
                {showCustomCalendar && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full">
                    {/* 달력 헤더 */}
                    <div className="flex items-center justify-between p-3 border-b">
                      <button type="button" onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded">
                        ←
                      </button>
                      <h3 className="font-medium">
                        {format(calendarDate, 'yyyy년 M월', { locale: ko })}
                      </h3>
                      <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                        →
                      </button>
                    </div>

                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 text-center text-xs text-gray-500 py-2">
                      {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                        <div key={day} className="py-1">{day}</div>
                      ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div className="grid grid-cols-7 text-center">
                      {getDaysInMonth(calendarDate).map((dayInfo, index) => {
                        const isSelected = selectedAppointmentDate === format(dayInfo.date, 'yyyy-MM-dd')
                        const isToday = format(dayInfo.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(dayInfo.date)}
                            className={`
                              p-2 text-sm hover:bg-blue-100 transition-colors
                              ${!dayInfo.isCurrentMonth ? 'text-gray-300' : 'text-gray-700'}
                              ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                              ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                            `}
                          >
                            {dayInfo.date.getDate()}
                          </button>
                        )
                      })}
                    </div>

                    <div className="p-3 border-t">
                      <button
                        type="button"
                        onClick={() => setShowCustomCalendar(false)}
                        className="w-full py-2 text-sm text-gray-600 hover:text-gray-800"
                      >
                        닫기
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 시 선택 - 전체의 25% */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">시</label>
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full h-12 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {generateHourOptions().map(hour => (
                    <option key={hour.value} value={hour.value}>
                      {hour.value}
                    </option>
                  ))}
                </select>
              </div>

              {/* 분 선택 - 전체의 25% */}
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">분</label>
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full h-12 px-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {generateMinuteOptions().map(minute => (
                    <option key={minute.value} value={minute.value}>
                      {minute.value}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 서비스 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Scissors className="w-4 h-4 inline mr-1" />
              서비스
            </label>
            <select
              value={formData.service_id}
              onChange={(e) => setFormData(prev => ({ ...prev, service_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">서비스 선택</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - {service.price.toLocaleString()}원 ({service.duration}분)
                </option>
              ))}
            </select>
          </div>

          {/* 담당자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              담당자 (선택)
            </label>
            <select
              value={formData.staff_id}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">담당자 선택</option>
              {staff.map(member => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role === 'admin' ? '관리자' : '직원'})
                </option>
              ))}
            </select>
          </div>

          {/* 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모 (선택)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="특이사항이나 요청사항을 입력해주세요..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || (!formData.customer_id && !showNewCustomer)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? '저장 중...' : (mode === 'edit' ? '수정' : '저장')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}