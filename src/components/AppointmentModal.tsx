'use client'

import { useState, useEffect, useRef } from 'react'
import { X, User, Phone, Calendar, Clock, Scissors, CreditCard, Search, ChevronDown, ChevronUp, History } from 'lucide-react'
import { format } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { getActiveServices, getActiveStaff, getCustomers, saveCustomer, saveAppointment, updateAppointment, getCustomerHistory, type AppointmentWithRelations } from '@/utils/supabaseService'
import { type Service, type Staff, type Customer } from '@/lib/supabase'
import ErrorModal, { createPhoneErrorModal, createNamePhoneErrorModal, createGeneralErrorModal } from './ErrorModal'
import DuplicateCustomerModal from './DuplicateCustomerModal'
import { useLanguage } from '@/contexts/LanguageContext'

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
  const { formatCurrency, t, language } = useLanguage()
  const [formData, setFormData] = useState({
    customer_id: '',
    staff_id: '',
    service_ids: [] as string[], // Changed to array for multiple services
    custom_duration: 0, // Custom duration input
    appointment_time: '10:00',
    notes: '',
    payment_method: 'cash' as 'cash' | 'card' | '',
    payment_amount: 0
  })

  // 시간 선택을 위한 별도 상태
  const [selectedHour, setSelectedHour] = useState('10')
  const [selectedMinute, setSelectedMinute] = useState('00')

  // 날짜 선택을 위한 상태
  const safeSelectedDate = selectedDate && !isNaN(selectedDate.getTime()) ? selectedDate : new Date()
  const [selectedAppointmentDate, setSelectedAppointmentDate] = useState(
    format(safeSelectedDate, 'yyyy-MM-dd')
  )
  const [showCustomCalendar, setShowCustomCalendar] = useState(false)
  const [calendarDate, setCalendarDate] = useState(new Date(selectedAppointmentDate))

  // 외부 클릭시 캘린더 닫기를 위한 ref
  const calendarRef = useRef<HTMLDivElement>(null)

  // Customer Name 필드 포커스를 위한 ref
  const customerNameRef = useRef<HTMLInputElement>(null)
  // Search Customer 필드 포커스를 위한 ref
  const searchCustomerRef = useRef<HTMLInputElement>(null)

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

  // 미국 국경일 확인 함수
  const isUSHoliday = (date: Date) => {
    const month = date.getMonth() + 1 // 1-12
    const day = date.getDate()
    const year = date.getFullYear()

    // 고정 날짜 국경일
    const fixedHolidays = [
      { month: 1, day: 1 },   // New Year's Day
      { month: 7, day: 4 },   // Independence Day
      { month: 11, day: 11 }, // Veterans Day
      { month: 12, day: 25 }  // Christmas Day
    ]

    // 고정 날짜 확인
    if (fixedHolidays.some(holiday => holiday.month === month && holiday.day === day)) {
      return true
    }

    // 계산이 필요한 국경일들

    // Memorial Day (5월 마지막 월요일)
    if (month === 5) {
      const memorialDay = getLastMondayOfMonth(year, 5)
      if (day === memorialDay) return true
    }

    // Labor Day (9월 첫째 월요일)
    if (month === 9) {
      const laborDay = getFirstMondayOfMonth(year, 9)
      if (day === laborDay) return true
    }

    // Martin Luther King Jr. Day (1월 셋째 월요일)
    if (month === 1) {
      const mlkDay = getNthMondayOfMonth(year, 1, 3)
      if (day === mlkDay) return true
    }

    // Presidents' Day (2월 셋째 월요일)
    if (month === 2) {
      const presidentsDay = getNthMondayOfMonth(year, 2, 3)
      if (day === presidentsDay) return true
    }

    // Columbus Day (10월 둘째 월요일)
    if (month === 10) {
      const columbusDay = getNthMondayOfMonth(year, 10, 2)
      if (day === columbusDay) return true
    }

    // Thanksgiving (11월 넷째 목요일)
    if (month === 11) {
      const thanksgiving = getNthThursdayOfMonth(year, 11, 4)
      if (day === thanksgiving) return true
    }

    return false
  }

  // 헬퍼 함수들
  const getLastMondayOfMonth = (year: number, month: number) => {
    const lastDay = new Date(year, month, 0) // 해당 월의 마지막 날
    for (let day = lastDay.getDate(); day >= 1; day--) {
      const testDate = new Date(year, month - 1, day)
      if (testDate.getDay() === 1) { // 월요일
        return day
      }
    }
    return 1
  }

  const getFirstMondayOfMonth = (year: number, month: number) => {
    for (let day = 1; day <= 7; day++) {
      const testDate = new Date(year, month - 1, day)
      if (testDate.getDay() === 1) { // 월요일
        return day
      }
    }
    return 1
  }

  const getNthMondayOfMonth = (year: number, month: number, nth: number) => {
    let mondayCount = 0
    for (let day = 1; day <= 31; day++) {
      const testDate = new Date(year, month - 1, day)
      if (testDate.getMonth() !== month - 1) break // 다음 달로 넘어감
      if (testDate.getDay() === 1) { // 월요일
        mondayCount++
        if (mondayCount === nth) {
          return day
        }
      }
    }
    return 1
  }

  const getNthThursdayOfMonth = (year: number, month: number, nth: number) => {
    let thursdayCount = 0
    for (let day = 1; day <= 31; day++) {
      const testDate = new Date(year, month - 1, day)
      if (testDate.getMonth() !== month - 1) break // 다음 달로 넘어감
      if (testDate.getDay() === 4) { // 목요일
        thursdayCount++
        if (thursdayCount === nth) {
          return day
        }
      }
    }
    return 1
  }

  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchCustomer, setSearchCustomer] = useState('')
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])

  // 선택된 서비스들과 총 소요시간 계산
  const selectedServices = services?.filter((s: Service) => formData.service_ids.includes(s.id)) || []
  const calculatedDuration = selectedServices.reduce((total, service) => total + service.duration, 0)

  // 실제 사용할 소요시간 (커스텀 입력이 있으면 커스텀, 없으면 계산된 시간)
  const finalDuration = formData.custom_duration > 0 ? formData.custom_duration : calculatedDuration

  // 완료된 예약 여부 확인
  const isCompletedAppointment = appointment && (
    appointment.status === 'completed' ||
    (appointment.status === 'scheduled' && new Date(appointment.appointment_date) < new Date(new Date().toDateString()))
  )
  const [showNewCustomer, setShowNewCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })
  const [loading, setLoading] = useState(false)

  // 에러 모달 상태
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    details: '',
    type: 'error' as const
  })

  // 중복 고객 모달 상태
  const [duplicateModal, setDuplicateModal] = useState({
    isOpen: false,
    existingCustomers: [] as Customer[]
  })

  // 고객 방문 기록 상태
  const [customerHistory, setCustomerHistory] = useState<AppointmentWithRelations[]>([])
  const [showHistory, setShowHistory] = useState(false)
  const [historyLoading, setHistoryLoading] = useState(false)

  // Customer Name 필드 자동 포커스
  useEffect(() => {
    if (showNewCustomer && customerNameRef.current) {
      setTimeout(() => {
        customerNameRef.current?.focus()
      }, 100)
    }
  }, [showNewCustomer])

  // Search Customer 필드 자동 포커스 (New Appointment 창 열릴 때)
  useEffect(() => {
    if (isOpen && mode === 'add' && !showNewCustomer && searchCustomerRef.current) {
      setTimeout(() => {
        searchCustomerRef.current?.focus()
      }, 100)
    }
  }, [isOpen, mode, showNewCustomer])

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
      console.log('AppointmentModal - Raw appointment data received:', appointment)
      console.log('AppointmentModal - appointment_time:', appointment.appointment_time)
      console.log('AppointmentModal - appointment_date:', appointment.appointment_date)

      // 기존 고객이 고객 목록에 있는지 확인
      const existingCustomer = customers.find(c => c.id === appointment.customer_id)

      // 안전한 시간 파싱
      const appointmentTime = appointment.appointment_time ? appointment.appointment_time.slice(0, 5) : '10:00'
      const [hour, minute] = appointmentTime.split(':')

      setSelectedHour(hour || '10')
      setSelectedMinute(minute || '00')
      setSelectedAppointmentDate(appointment.appointment_date || format(new Date(), 'yyyy-MM-dd'))

      // Get service IDs from the services array (new format) or fallback to old format
      let serviceIds: string[] = []
      let customDuration = 0

      console.log('DEBUG Edit mode - Raw appointment data:', {
        appointmentId: appointment.id,
        services: appointment.services,
        service_id: appointment.service_id,
        duration: appointment.duration,
        customer: appointment.customer?.name
      })

      if (appointment.services && appointment.services.length > 0) {
        // New format: use services array
        serviceIds = appointment.services.map(service => service.id)
        customDuration = appointment.duration
        console.log('DEBUG Edit mode - Using services array:', serviceIds)
      } else if (appointment.service_id) {
        // Old format fallback: try to parse service_id
        try {
          const parsed = JSON.parse(appointment.service_id)
          serviceIds = Array.isArray(parsed) ? parsed : [appointment.service_id]
          console.log('DEBUG Edit mode - Parsed JSON service_id:', serviceIds)
        } catch {
          serviceIds = [appointment.service_id]
          console.log('DEBUG Edit mode - Single service_id:', serviceIds)
        }
        customDuration = appointment.duration
      }

      console.log('DEBUG Edit mode - Final serviceIds:', serviceIds, 'customDuration:', customDuration)

      setFormData({
        customer_id: appointment.customer_id,
        staff_id: appointment.staff_id || '',
        service_ids: serviceIds,
        custom_duration: customDuration,
        appointment_time: appointmentTime,
        notes: (appointment.notes || '').replace(/\n?\[MULTI_SERVICES\]:.*$/, ''), // Hide technical info from user
        payment_method: appointment.payment_method || 'cash',
        payment_amount: appointment.payment_amount || 0
      })

      // 고객명을 검색 필드에 표시
      setSearchCustomer(existingCustomer?.name || appointment.customer?.name || '')

      // 수정 모드에서 고객 방문 기록 조회
      if (appointment.customer_id) {
        fetchCustomerHistory(appointment.customer_id)
        setShowHistory(true)
      }
    }
  }, [isOpen, appointment, mode, customers])

  const fetchData = async () => {
    try {
      // 병렬로 모든 데이터 가져오기
      const [customersData, servicesData, staffData] = await Promise.all([
        getCustomers(),
        getActiveServices(), // 예약 시에는 활성 서비스만 표시
        getActiveStaff() // 예약 시에는 활성 직원만 표시
      ])

      setCustomers(customersData)
      setServices(servicesData)
      setStaff(staffData)

      // 새 예약 추가 모드에서 자동 선택 처리
      if (mode === 'add') {
        // 서비스가 선택되지 않은 경우 첫 번째 서비스 자동 선택
        if (formData.service_ids.length === 0 && servicesData.length > 0) {
          setFormData(prev => ({ ...prev, service_ids: [servicesData[0].id] }))
        }

        // 담당자가 선택되지 않은 경우 첫 번째 직원 자동 선택
        if (!formData.staff_id && staffData.length > 0) {
          // staff 역할을 우선으로 정렬된 첫 번째 직원 선택
          const sortedStaff = [...staffData].sort((a, b) => {
            if (a.role === 'staff' && b.role === 'admin') return -1
            if (a.role === 'admin' && b.role === 'staff') return 1
            return 0
          })
          setFormData(prev => ({ ...prev, staff_id: sortedStaff[0].id }))
        }
      }
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    }
  }

  const filteredCustomers = customers.filter(customer =>
    customer.name.toLowerCase().includes(searchCustomer.toLowerCase()) ||
    (customer.phone && customer.phone.includes(searchCustomer))
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

  // 고객 방문 기록 조회
  const fetchCustomerHistory = async (customerId: string) => {
    console.log('고객 방문 기록 조회 시작:', customerId) // 디버깅
    setHistoryLoading(true)
    try {
      const history = await getCustomerHistory(customerId)
      console.log('조회된 방문 기록:', history) // 디버깅
      setCustomerHistory(history)
    } catch (error) {
      console.error('방문 기록 조회 실패:', error)
      setCustomerHistory([])
    } finally {
      setHistoryLoading(false)
    }
  }

  // 잠재적 중복 고객 찾기
  const findPotentialDuplicates = (customerData: { name: string; phone?: string }) => {
    const searchName = customerData.name.trim().toLowerCase()
    const searchPhone = customerData.phone?.trim()

    return customers.filter(customer => {
      // 이름이 정확히 일치
      const nameMatch = customer.name.trim().toLowerCase() === searchName

      // 전화번호 조건 확인
      const customerPhone = customer.phone?.trim()

      // 둘 다 전화번호가 없는 경우 (null, undefined, 빈 문자열 모두 포함)
      const bothNoPhone = (!customerPhone || customerPhone === '') && (!searchPhone || searchPhone === '')

      // 전화번호가 정확히 일치하는 경우 (숫자만 비교)
      const phoneMatch = customerPhone && searchPhone &&
                        customerPhone.replace(/[^0-9]/g, '') === searchPhone.replace(/[^0-9]/g, '')

      return nameMatch && (bothNoPhone || phoneMatch)
    })
  }

  // 중복 고객 처리 함수들
  const handleUseExistingCustomer = async (existingCustomer: Customer) => {
    setDuplicateModal({ isOpen: false, existingCustomers: [] })

    // 기존 고객 ID로 예약 생성 로직 실행
    await createAppointmentWithCustomer(existingCustomer.id)
  }

  const handleReEnterInfo = () => {
    setDuplicateModal({ isOpen: false, existingCustomers: [] })
    // 고객 정보 입력 폼으로 돌아가서 사용자가 다른 정보를 입력할 수 있도록 함
    // 아무 것도 하지 않고 모달만 닫으면 됨
  }

  // 실제 예약 생성 로직
  const createAppointmentWithCustomer = async (customerId: string) => {
    const selectedStaff = formData.staff_id ? staff.find(s => s.id === formData.staff_id) : null

    if (selectedServices.length === 0) {
      throw new Error(t('select_service_required'))
    }

    console.log('Saving appointment with data:', {
      serviceIds: formData.service_ids,
      finalDuration: finalDuration,
      selectedServices: selectedServices.map(s => s.name)
    })

    // 상태 결정 로직 (데이터베이스에는 scheduled/completed/cancelled만 저장)
    let appointmentStatus = 'scheduled'
    if (isCompletedAppointment && formData.payment_amount && formData.payment_amount > 0) {
      // 완료된 예약 + 결제정보 있음 → completed
      appointmentStatus = 'completed'
    }
    // 완료되었지만 결제정보 없음 → scheduled로 유지 (화면에서는 auto_completed로 표시됨)

    const appointmentData = {
      customer_id: customerId,
      staff_id: selectedStaff?.id || undefined,
      service_id: formData.service_ids[0], // First service for backward compatibility
      service_ids: formData.service_ids, // Pass all selected services
      appointment_date: selectedAppointmentDate,
      appointment_time: formData.appointment_time,
      duration: finalDuration,
      notes: formData.notes,
      status: appointmentStatus as 'scheduled' | 'completed' | 'cancelled' | 'auto_completed',
      // 완료된 예약인 경우 결제 정보 포함 (선택사항)
      ...(isCompletedAppointment && {
        payment_method: formData.payment_method || undefined,
        payment_amount: formData.payment_amount > 0 ? formData.payment_amount : undefined
      })
    }

    let result: AppointmentWithRelations
    if (mode === 'edit' && appointment) {
      const updated = await updateAppointment(appointment.id, appointmentData)
      if (!updated) {
        throw new Error(t('appointment_update_failed'))
      }
      result = updated
    } else {
      result = await saveAppointment(appointmentData)
    }

    onSave(result)
    onClose()
    resetForm()
  }

  // 새 고객 저장 및 예약 생성
  const saveNewCustomerAndAppointment = async () => {
    try {
      // 실제 고객 저장 시도
      const newCustomerData = await saveCustomer({
        name: newCustomer.name.trim(),
        phone: newCustomer.phone?.trim() || undefined,
        email: newCustomer.email?.trim() || undefined,
        notes: newCustomer.notes?.trim() || undefined
      })

      await createAppointmentWithCustomer(newCustomerData.id)

      // 고객 목록 새로고침
      await fetchData()
    } catch (error: any) {
      // 이름+전화번호 중복 제약조건 위반 시 중복 모달 표시
      const isDuplicateError = error.message && (
        error.message.includes('duplicate key value violates unique constraint "unique_name_phone_with_number"') ||
        error.message.includes('duplicate key value violates unique constraint "unique_name_no_phone"') ||
        error.message.includes('duplicate key value violates unique constraint "unique_name_phone_not_null"') ||
        error.message.includes('duplicate key value violates unique constraint "unique_name_when_phone_null"') ||
        error.message.includes('duplicate key value violates unique constraint "unique_name_phone"')
      )

      if (isDuplicateError) {
        const potentialDuplicates = findPotentialDuplicates({
          name: newCustomer.name,
          phone: newCustomer.phone
        })

        setDuplicateModal({
          isOpen: true,
          existingCustomers: potentialDuplicates
        })
        return // 중복 모달을 띄우고 여기서 중단
      }

      // 다른 에러는 상위로 전파
      throw error
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // 디버깅: Supabase 연결 테스트
      console.log('🔍 Testing Supabase connection...')
      console.log('Environment variables:', {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        nodeEnv: process.env.NODE_ENV
      })
      console.log('📊 Form data being submitted:', formData)
      console.log('🎯 Selected services:', selectedServices.map(s => ({ id: s.id, name: s.name })))
      console.log('👤 Show new customer:', showNewCustomer)
      console.log('📋 Mode:', mode)

      // 새 고객 등록 처리
      if (showNewCustomer) {
        console.log('💾 Saving new customer and appointment...')
        await saveNewCustomerAndAppointment()
      } else if (!formData.customer_id) {
        throw new Error(t('select_customer_required'))
      } else {
        // 기존 고객 선택된 경우
        console.log('✏️ Creating appointment with existing customer:', formData.customer_id)
        await createAppointmentWithCustomer(formData.customer_id)
      }
    } catch (error: any) {
      console.error('예약 저장 실패:', error)
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        stack: error?.stack,
        type: typeof error,
        keys: Object.keys(error || {})
      })

      // 일반 에러 처리
      const errorConfig = createGeneralErrorModal(
        error.message || t('appointment_save_failed'),
        error.code ? `${t('error_code')}: ${error.code}` : undefined
      )

      setErrorModal({
        isOpen: true,
        title: errorConfig.title,
        message: errorConfig.message,
        details: errorConfig.details || '',
        type: errorConfig.type
      })
    } finally {
      setLoading(false)
    }
  }


  const resetForm = () => {
    setFormData({
      customer_id: '',
      staff_id: staff.length > 0 ? staff[0].id : '',
      service_ids: services.length > 0 ? [services[0].id] : [],
      custom_duration: 0,
      appointment_time: '10:00',
      notes: '',
      payment_method: 'cash',
      payment_amount: 0
    })
    setSelectedHour('10')
    setSelectedMinute('00')
    setSelectedAppointmentDate(format(selectedDate, 'yyyy-MM-dd'))
    setSearchCustomer('')
    setShowNewCustomer(false)
    setNewCustomer({ name: '', phone: '', email: '', notes: '' })
    setErrorModal({
      isOpen: false,
      title: '',
      message: '',
      details: '',
      type: 'error'
    })
    setDuplicateModal({
      isOpen: false,
      existingCustomers: []
    })
    setCustomerHistory([])
    setShowHistory(false)
    setHistoryLoading(false)
  }


  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between py-2 px-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {mode === 'edit'
              ? isCompletedAppointment
                ? t('completed_appointment_edit')
                : t('appointment_edit_title')
              : t('appointment_add_title')}
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 고객 정보 섹션 */}
          <div className="space-y-2">
            {!showNewCustomer ? (
              <div className="space-y-2">
                {/* 고객 정보 + 이름 검색 필드 */}
                <div className="flex items-center gap-3">
                  <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap">
                    <User className="w-4 h-4 inline mr-1" />
                    {t('customer_info_label')}
                  </label>
                  <div className="relative flex-1">
                    <input
                      ref={searchCustomerRef}
                      type="text"
                      placeholder={t('search_customer_name_phone')}
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
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                {/* 검색된 고객 리스트 */}
                {searchCustomer && (
                  <div className="flex gap-3">
                    <div className="w-[100px]"></div>
                    <div className="flex-1 max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(customer => (
                          <button
                            key={customer.id}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({ ...prev, customer_id: customer.id }))
                              setSearchCustomer(customer.name)
                              fetchCustomerHistory(customer.id)
                              setShowHistory(true)
                            }}
                            className={`w-full p-2 text-left hover:bg-gray-50 border-b last:border-b-0 text-sm ${
                              formData.customer_id === customer.id ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="font-medium">
                              {customer.name}
                              <span className="text-gray-500 ml-2">
                                {customer.phone ? `(${customer.phone})` : `(${t('no_phone_number')})`}
                              </span>
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="p-2 text-gray-500 text-center text-sm">
                          {t('customer_not_found')}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* 선택된 고객의 최근 방문 기록 */}
            {formData.customer_id && !showNewCustomer && (
              <div className="flex gap-3">
                <div className="w-[100px]"></div>
                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <History className="w-4 h-4" />
                    {t('recent_visits')} ({customerHistory.length}{t('visits_count')})
                    {showHistory ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showHistory && (
                    <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-48 overflow-y-auto">
                    {historyLoading ? (
                      <div className="text-center py-4 text-gray-500">
                        {t('loading_history')}
                      </div>
                    ) : customerHistory.length > 0 ? (
                      <div className="space-y-0.5">
                        {customerHistory.map((appointment, index) => {
                          const appointmentDate = new Date(appointment.appointment_date)
                          const isCompleted = appointment.status === 'completed' ||
                            (appointment.status === 'scheduled' && appointmentDate < new Date(new Date().toDateString()))

                          return (
                            <div
                              key={appointment.id}
                              className="bg-white rounded px-3 py-1 border text-sm flex items-center justify-between"
                            >
                              <div className="flex items-center gap-3">
                                <span className="text-gray-600 font-mono">
                                  {`${String(appointmentDate.getMonth() + 1).padStart(2, '0')}/${String(appointmentDate.getDate()).padStart(2, '0')}`}
                                </span>
                                <div>
                                  {appointment.services && appointment.services.length > 0 ? (
                                    <span className="font-medium text-gray-900">
                                      {appointment.services.map(service => service.name).join(', ')}
                                    </span>
                                  ) : (
                                    <span className="font-medium text-gray-900">
                                      {t('no_service_info')}
                                    </span>
                                  )}
                                </div>
                                {appointment.staff && (
                                  <span className="text-gray-500 text-xs">
                                    {appointment.staff.name}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 text-xs rounded ${
                                  isCompleted ? 'bg-green-100 text-green-700' :
                                  appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                                  'bg-blue-100 text-blue-700'
                                }`}>
                                  {isCompleted ? '✓' :
                                   appointment.status === 'cancelled' ? '✕' : '○'}
                                </span>
                              </div>
                              {appointment.notes && (
                                <div className="ml-2 text-xs text-gray-400 truncate max-w-20" title={appointment.notes}>
                                  📝
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-2 text-gray-500 text-sm">
                        {t('no_visit_history')}
                      </div>
                    )}
                  </div>
                )}
                </div>
              </div>
            )}

            {/* 새 고객 등록 */}
            {!showNewCustomer ? (
              <div className="flex gap-3">
                <div className="w-[100px]"></div>
                <button
                  type="button"
                  onClick={() => setShowNewCustomer(true)}
                  className="flex-1 p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-all"
                >
                  + {t('new_customer_register')}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <div className="w-[100px]"></div>
                <div className="flex-1 space-y-3 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">{t('new_customer_info')}</h4>
                    <button
                      type="button"
                      onClick={() => setShowNewCustomer(false)}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      {t('cancel')}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      ref={customerNameRef}
                      type="text"
                      placeholder={t('customer_name_label')}
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                      required
                    />
                    <input
                      type="tel"
                      placeholder={t('phone_number_optional')}
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, phone: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="email"
                      placeholder={t('email_optional')}
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, email: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <input
                      type="text"
                      placeholder={t('notes_optional')}
                      value={newCustomer.notes}
                      onChange={(e) => setNewCustomer(prev => ({ ...prev, notes: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t border-gray-200"></div>

          {/* 날짜 및 시간 */}
          <div className="flex items-center gap-3">
            <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap">
              <Calendar className="w-4 h-4 inline mr-1" />
              {t('date_time_label')}
            </label>
            <div className="flex gap-2 flex-1">
              {/* 날짜 선택 - 전체의 50% */}
              <div className="flex-[2] relative" ref={calendarRef}>
                <button
                  type="button"
                  onClick={() => setShowCustomCalendar(!showCustomCalendar)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-left bg-white hover:bg-gray-50 relative flex items-center text-sm"
                >
                  {selectedAppointmentDate || t('date_selection')}
                  <Calendar className="w-4 h-4 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </button>

                {/* 커스텀 달력 */}
                {showCustomCalendar && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-full">
                    {/* 달력 헤더 */}
                    <div className="flex items-center justify-between py-1 px-2 border-b">
                      <button type="button" onClick={goToPrevMonth} className="p-1 hover:bg-gray-100 rounded">
                        ←
                      </button>
                      <h3 className="font-medium">
                        {format(calendarDate, language === 'ko' ? 'yyyy년 M월' : 'MMM yyyy', { locale: language === 'ko' ? ko : enUS })}
                      </h3>
                      <button type="button" onClick={goToNextMonth} className="p-1 hover:bg-gray-100 rounded">
                        →
                      </button>
                    </div>

                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-7 text-center text-xs py-2">
                      {(language === 'ko'
                        ? ['일', '월', '화', '수', '목', '금', '토']
                        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                      ).map((day, index) => (
                        <div key={day} className={`py-1 ${
                          index === 0 ? 'text-red-600' :
                          index === 6 ? 'text-blue-600' :
                          'text-gray-500'
                        }`}>{day}</div>
                      ))}
                    </div>

                    {/* 날짜 그리드 */}
                    <div className="grid grid-cols-7 text-center">
                      {getDaysInMonth(calendarDate).map((dayInfo, index) => {
                        const isSelected = selectedAppointmentDate === format(dayInfo.date, 'yyyy-MM-dd')
                        const isToday = format(dayInfo.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
                        const dayOfWeek = dayInfo.date.getDay() // 0=Sunday, 6=Saturday
                        const isSunday = dayOfWeek === 0
                        const isSaturday = dayOfWeek === 6
                        const isHoliday = isUSHoliday(dayInfo.date)

                        // 색상 결정 로직
                        let textColor = 'text-gray-700'
                        if (!dayInfo.isCurrentMonth) {
                          textColor = 'text-gray-300'
                        } else if (isSunday || isHoliday) {
                          textColor = 'text-red-600'
                        } else if (isSaturday) {
                          textColor = 'text-blue-600'
                        }

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(dayInfo.date)}
                            className={`
                              p-2 text-sm hover:bg-blue-100 transition-colors
                              ${textColor}
                              ${isSelected ? 'bg-blue-600 text-white hover:bg-blue-700' : ''}
                              ${isToday && !isSelected ? 'bg-blue-100 text-blue-600' : ''}
                            `}
                          >
                            {dayInfo.date.getDate()}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* 시 선택 - 전체의 25% */}
              <div className="flex-1">
                <select
                  value={selectedHour}
                  onChange={(e) => setSelectedHour(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
                <select
                  value={selectedMinute}
                  onChange={(e) => setSelectedMinute(e.target.value)}
                  className="w-full px-2 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
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
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap pt-2">
                <Scissors className="w-4 h-4 inline mr-1" />
                {t('service_label')}
              </label>
              <div className="flex-1">
                <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                  {services.map(service => (
                    <label key={service.id} className="flex items-center gap-2 p-1 hover:bg-gray-50 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.service_ids.includes(service.id)}
                        onChange={(e) => {
                          const isChecked = e.target.checked
                          setFormData(prev => ({
                            ...prev,
                            service_ids: isChecked
                              ? [...prev.service_ids, service.id]
                              : prev.service_ids.filter(id => id !== service.id),
                            custom_duration: 0 // Reset custom duration when services change
                          }))
                        }}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-900 flex-1">
                        {service.name} ({service.duration}{t('minutes')})
                      </span>
                    </label>
                  ))}
                </div>
                {formData.service_ids.length === 0 && (
                  <p className="text-xs text-red-500 mt-1">{t('select_service_required')}</p>
                )}
              </div>
            </div>

            {/* 소요시간 */}
            <div className="flex items-center gap-3">
              <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap">
                {t('duration_label')}
              </label>
              <div className="flex-1 flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    {t('suggested')}: {calculatedDuration}{t('minutes')}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="480"
                  step="5"
                  placeholder={calculatedDuration.toString()}
                  value={formData.custom_duration || ''}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    custom_duration: parseInt(e.target.value) || 0
                  }))}
                  className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">{t('minutes')}</span>
                <span className="text-xs text-gray-500">
                  ({t('final_duration')}: {finalDuration}{t('minutes')})
                </span>
              </div>
            </div>
          </div>

          {/* 담당자 */}
          <div className="flex items-center gap-3">
            <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap">
              {t('staff_label')}
            </label>
            <select
              value={formData.staff_id || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_id: e.target.value }))}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {staff
                .sort((a, b) => {
                  // Staff 역할을 먼저, Admin 역할을 나중에
                  if (a.role === 'staff' && b.role === 'admin') return -1
                  if (a.role === 'admin' && b.role === 'staff') return 1
                  return 0
                })
                .map(member => (
                  <option key={member.id} value={member.id}>
                    {member.name} ({member.role === 'admin' ? t('admin_role') : t('staff_role')})
                  </option>
                ))}
            </select>
          </div>

          {/* 메모 */}
          <div className="flex items-start gap-3">
            <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap pt-2">
              {t('memo_label')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder={t('notes_placeholder')}
              rows={2}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none text-sm"
            />
          </div>

          {/* 결제 정보 (완료된 예약만) */}
          {isCompletedAppointment && (
            <>
              {/* 구분선 */}
              <div className="border-t border-gray-200"></div>

              {/* 결제 정보 */}
              <div className="flex items-center gap-3">
                <label className="w-[100px] text-sm font-medium text-gray-700 whitespace-nowrap">
                  <CreditCard className="w-4 h-4 inline mr-1" />
                  {t('payment_method')}
                </label>
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="cash"
                        checked={formData.payment_method === 'cash'}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'card' }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('cash')}</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="payment_method"
                        value="card"
                        checked={formData.payment_method === 'card'}
                        onChange={(e) => setFormData(prev => ({ ...prev, payment_method: e.target.value as 'cash' | 'card' }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{t('card')}</span>
                    </label>
                  </div>
                  <div className="flex items-center gap-2 ml-auto">
                    {process.env.NEXT_PUBLIC_CURRENCY === 'USD' && (
                      <span className="text-sm text-gray-600">$</span>
                    )}
                    <input
                      type="number"
                      min="0"
                      step={process.env.NEXT_PUBLIC_CURRENCY === 'KRW' ? '1000' : '1'}
                      value={formData.payment_amount || ''}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        payment_amount: e.target.value === '' ? 0 : parseInt(e.target.value) || 0
                      }))}
                      className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="0"
                    />
                    {process.env.NEXT_PUBLIC_CURRENCY === 'KRW' && (
                      <span className="text-sm text-gray-600">원</span>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={() => {
                resetForm()
                onClose()
              }}
              className="px-6 py-3 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading || (!formData.customer_id && !showNewCustomer)}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {loading ? t('saving') : (mode === 'edit' ? t('update') : t('save'))}
            </button>
          </div>
        </form>
      </div>
      </div>

      {/* 에러 모달 */}
      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal(prev => ({ ...prev, isOpen: false }))}
        title={errorModal.title}
        message={errorModal.message}
        details={errorModal.details}
        type={errorModal.type}
      />

      {/* 중복 고객 모달 */}
      <DuplicateCustomerModal
        isOpen={duplicateModal.isOpen}
        onClose={() => setDuplicateModal({ isOpen: false, existingCustomers: [] })}
        newCustomerData={newCustomer}
        existingCustomers={duplicateModal.existingCustomers}
        onUseExisting={handleUseExistingCustomer}
        onReEnterInfo={handleReEnterInfo}
      />
    </>
  )
}