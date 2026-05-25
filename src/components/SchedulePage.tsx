'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { Calendar, Clock, User, Plus, Trash2, X } from 'lucide-react'
import AppointmentModal from '@/components/AppointmentModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { getAppointmentsByDateRange, deleteAppointment, type AppointmentWithRelations } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SchedulePage() {
  const { t, language } = useLanguage()
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [loading, setLoading] = useState(true)

  // 모달 관련 상태
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add')
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentWithRelations | null>(null)

  // 삭제 확인 모달 상태
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = useState<AppointmentWithRelations | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  // 이번 주 날짜들 생성
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // 일요일 시작
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // 시간 블록 생성 (1시간 단위: 09:00 ~ 19:00)
  const hourBlocks = []
  for (let hour = 9; hour <= 19; hour++) {
    hourBlocks.push(hour)
  }

  // 스크롤바 숨김 스타일
  const hideScrollbarStyle = `
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `

  useEffect(() => {
    fetchAppointments()
  }, [currentDate])

  const fetchAppointments = async () => {
    setLoading(true)
    try {
      const startDate = format(weekStart, 'yyyy-MM-dd')
      const endDate = format(addDays(weekStart, 6), 'yyyy-MM-dd')
      const appointments = await getAppointmentsByDateRange(startDate, endDate)

      setAppointments(appointments)
    } catch (error) {
      console.error('예약 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 모달 관련 함수들
  const handleAddAppointment = (date: Date, hour?: number, minute?: number) => {
    setSelectedDate(date)
    setModalMode('add')
    setSelectedAppointment(null)

    // 시간 정보가 있으면 초기값으로 설정
    if (hour !== undefined && minute !== undefined) {
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
      setSelectedTime(timeString)
    } else {
      setSelectedTime(null)
    }

    setModalOpen(true)
  }

  const [selectedTime, setSelectedTime] = useState<string | null>(null)

  const handleEditAppointment = (appointment: AppointmentWithRelations) => {
    setSelectedDate(parseISO(appointment.appointment_date))
    setModalMode('edit')
    setSelectedAppointment(appointment)
    setModalOpen(true)
  }

  const handleModalSave = async (savedAppointment: AppointmentWithRelations | null) => {
    if (savedAppointment) {
      // 새로 추가되거나 수정된 경우
      setAppointments(prev => {
        const existingIndex = prev.findIndex(apt => apt.id === savedAppointment.id)
        if (existingIndex >= 0) {
          // 수정
          const updated = [...prev]
          updated[existingIndex] = savedAppointment
          return updated
        } else {
          // 새 추가
          return [...prev, savedAppointment]
        }
      })
    } else {
      // 삭제된 경우
      if (selectedAppointment) {
        setAppointments(prev => prev.filter(apt => apt.id !== selectedAppointment.id))
      }
    }
    await fetchAppointments() // 전체 새로고침
  }

  // 삭제 확인 모달 관련 함수들
  const handleDeleteClick = (appointment: AppointmentWithRelations) => {
    setAppointmentToDelete(appointment)
    setDeleteModalOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!appointmentToDelete) return

    setDeleteLoading(true)
    try {
      await deleteAppointment(appointmentToDelete.id)
      await fetchAppointments()
      setDeleteModalOpen(false)
      setAppointmentToDelete(null)
    } catch (error) {
      console.error('예약 삭제 실패:', error)
      alert('예약 삭제에 실패했습니다.')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false)
    setAppointmentToDelete(null)
    setDeleteLoading(false)
  }

  const getAppointmentsForDate = (date: Date) => {
    return appointments.filter(apt =>
      isSameDay(parseISO(apt.appointment_date), date) && apt.status !== 'cancelled'
    )
  }

  // 특정 날짜와 시간대의 예약들 가져오기
  const getAppointmentsForHour = (date: Date, hour: number) => {
    const dayAppointments = getAppointmentsForDate(date)
    return dayAppointments.filter(apt => {
      const appointmentTime = apt.appointment_time.slice(0, 5)
      const [appointmentHour] = appointmentTime.split(':').map(Number)
      return appointmentHour === hour
    })
  }

  // 두 예약이 시간적으로 겹치는지 확인
  // Helper function to get total duration of an appointment
  const getAppointmentDuration = (appointment: AppointmentWithRelations): number => {
    let calculatedDuration = 30 // default minimum

    // PRIORITIZE custom duration (important for multiple services with custom time)
    if (appointment.duration && appointment.duration > 0) {
      calculatedDuration = appointment.duration
      console.log(`Using custom duration for ${appointment.id}:`, calculatedDuration)
    } else if (appointment.services && appointment.services.length > 0) {
      calculatedDuration = appointment.services.reduce((sum, service) => sum + service.duration, 0)
      console.log(`Using services duration for ${appointment.id}:`, appointment.services.map(s => s.name), 'Total:', calculatedDuration)
    }

    // Debug log for the problematic appointment
    if (appointment.customer?.name === 'Gayeon Kim') {
      console.log('DEBUG Gayeon Kim appointment:', {
        id: appointment.id,
        services: appointment.services,
        customDuration: appointment.duration,
        finalDuration: calculatedDuration,
        rawData: appointment
      })
    }

    return calculatedDuration
  }

  const isOverlapping = (apt1: AppointmentWithRelations, apt2: AppointmentWithRelations) => {
    // 날짜가 다르면 겹치지 않음
    if (apt1.appointment_date !== apt2.appointment_date) {
      return false
    }

    const getMinutes = (timeStr: string) => {
      const [hour, minute] = timeStr.slice(0, 5).split(':').map(Number)
      return hour * 60 + minute
    }

    const apt1Start = getMinutes(apt1.appointment_time)
    const apt1End = apt1Start + getAppointmentDuration(apt1)
    const apt2Start = getMinutes(apt2.appointment_time)

    // 시작시간순 정렬 가정: apt1이 apt2보다 먼저 시작
    // 겹침 조건: apt1이 끝나기 전에 apt2가 시작하면 겹침
    const overlaps = apt1End > apt2Start

    // Debug for testing
    if (apt1.customer?.name === 'Gayeon Kim' || apt2.customer?.name === 'Gayeon Kim' ||
        apt1.customer?.name === '서은정' || apt2.customer?.name === '서은정') {
      console.log('🔍 Simplified overlap check:', {
        apt1: { time: apt1.appointment_time, customer: apt1.customer?.name, start: apt1Start, end: apt1End },
        apt2: { time: apt2.appointment_time, customer: apt2.customer?.name, start: apt2Start },
        condition: `${apt1End} > ${apt2Start}`,
        overlaps
      })
    }

    return overlaps
  }


  // 겹치는 예약들을 그룹핑하고 정렬
  const groupOverlappingAppointments = (appointments: AppointmentWithRelations[]) => {
    // Debug log for 12:30 appointments
    const twelveThirtyAppts = appointments.filter(apt => apt.appointment_time.startsWith('12:30'))
    if (twelveThirtyAppts.length > 0) {
      console.log('🕐 12:30 Appointments found:', twelveThirtyAppts.map(apt => ({
        time: apt.appointment_time,
        customer: apt.customer?.name,
        duration: getAppointmentDuration(apt),
        services: apt.services?.map(s => s.name) || 'no services'
      })))

      // Also log ALL appointments to see the context
      console.log('📋 All appointments in this group call:', appointments.map(apt => ({
        id: apt.id.slice(-8),
        time: apt.appointment_time,
        customer: apt.customer?.name,
        date: apt.appointment_date,
        exactTime: apt.appointment_time
      })))

      // Special check for exact same time appointments
      const exactSameTimeGroups = appointments.reduce((acc, apt) => {
        const key = `${apt.appointment_date}_${apt.appointment_time}`
        if (!acc[key]) acc[key] = []
        acc[key].push(apt)
        return acc
      }, {} as Record<string, typeof appointments>)

      Object.entries(exactSameTimeGroups).forEach(([key, appts]) => {
        if (appts.length > 1) {
          console.log('⚡ EXACT SAME TIME APPOINTMENTS:', key, appts.map(a => a.customer?.name))
        }
      })

      // Count how many 12:30 appointments are in this call
      console.log('🔢 Number of 12:30 appointments in this call:', twelveThirtyAppts.length)
    }

    const groups: AppointmentWithRelations[][] = []
    const processed = new Set<string>()

    for (const apt of appointments) {
      if (processed.has(apt.id)) continue

      const group = [apt]
      processed.add(apt.id)

      // Debug for 12:30 appointments
      if (apt.appointment_time.startsWith('12:30')) {
        console.log('🔄 Processing 12:30 appointment:', apt.customer?.name, 'looking for overlaps...')
      }

      // 현재 예약과 겹치는 모든 예약 찾기
      for (const otherApt of appointments) {
        if (processed.has(otherApt.id)) {
          // Debug: skip already processed
          if (apt.appointment_time.startsWith('12:30') || otherApt.appointment_time.startsWith('12:30')) {
            console.log('⏭️ Skipping already processed:', otherApt.customer?.name)
          }
          continue
        }

        // Check if we're comparing 12:30 appointments
        if (apt.appointment_time.startsWith('12:30') || otherApt.appointment_time.startsWith('12:30')) {
          console.log('🔍 Checking if overlap between:', {
            apt1: { time: apt.appointment_time, customer: apt.customer?.name },
            apt2: { time: otherApt.appointment_time, customer: otherApt.customer?.name }
          })
        }

        if (group.some(groupApt => isOverlapping(groupApt, otherApt))) {
          group.push(otherApt)
          processed.add(otherApt.id)

          if (apt.appointment_time.startsWith('12:30') || otherApt.appointment_time.startsWith('12:30')) {
            console.log('✅ Found overlap! Added to group:', otherApt.customer?.name)
          }
        }
      }

      // 그룹 내에서 정렬: 시간순 우선, 그다음 등록시간
      group.sort((a, b) => {
        const timeA = a.appointment_time.slice(0, 5)
        const timeB = b.appointment_time.slice(0, 5)
        if (timeA !== timeB) {
          return timeA.localeCompare(timeB)
        }
        return a.created_at.localeCompare(b.created_at)
      })

      groups.push(group)
    }

    // Debug output for groups with 12:30 appointments
    groups.forEach((group, idx) => {
      if (group.some(apt => apt.appointment_time.startsWith('12:30'))) {
        console.log(`📊 Group ${idx} contains 12:30 appointment:`, group.map(apt => ({
          time: apt.appointment_time,
          customer: apt.customer?.name,
          groupSize: group.length
        })))
      }
    })

    return groups
  }

  // 예약의 시작 위치와 높이 계산 (1시간 = 100% 기준)
  const calculateAppointmentStyle = (appointment: AppointmentWithRelations, groupIndex: number, groupSize: number) => {
    const appointmentTime = appointment.appointment_time.slice(0, 5)
    const [hour, minute] = appointmentTime.split(':').map(Number)

    // 시간 내에서의 시작 위치 (분 기준)
    const topPercentage = (minute / 60) * 100

    // 높이 계산 (소요시간 기준, 최소 30분으로 표시)
    const duration = Math.max(getAppointmentDuration(appointment), 30)
    const heightPercentage = (duration / 60) * 100 // Remove 100% limit for multi-hour appointments

    // Debug log for Gayeon Kim appointment
    if (appointment.customer?.name === 'Gayeon Kim') {
      console.log('DEBUG Height calculation for Gayeon Kim:', {
        duration: duration,
        heightPercentage: heightPercentage,
        appointmentTime: appointment.appointment_time
      })
    }

    // 너비와 위치 계산 (겹치는 예약이 있으면 나누어 배치)
    const width = groupSize > 1 ? `${100 / groupSize}%` : 'calc(100% - 4px)'
    const left = groupSize > 1 ? `${(groupIndex / groupSize) * 100}%` : '2px'

    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      width: width,
      left: left,
      minHeight: '40px'
    }
  }

  // 예약이 완료되었는지 확인하는 함수
  const isAppointmentCompleted = (appointment: AppointmentWithRelations) => {
    if (appointment.status === 'completed') {
      return true
    }

    if (appointment.status === 'scheduled') {
      // 예약 날짜와 시간을 현재 시간과 비교
      const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
      const now = new Date()
      return appointmentDateTime < now
    }

    return false
  }

  // 미국 공휴일 확인 함수
  const isUSHoliday = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const day = date.getDate()

    // 고정 날짜 공휴일들
    const fixedHolidays = [
      `${year}-01-01`, // New Year's Day
      `${year}-07-04`, // Independence Day
      `${year}-11-11`, // Veterans Day
      `${year}-12-25`, // Christmas Day
    ]

    const dateStr = format(date, 'yyyy-MM-dd')
    if (fixedHolidays.includes(dateStr)) {
      return true
    }

    // 동적 공휴일 계산
    const getNthWeekdayOfMonth = (year: number, month: number, weekday: number, nth: number) => {
      const firstDay = new Date(year, month - 1, 1)
      const firstWeekday = firstDay.getDay()
      const daysToAdd = (weekday - firstWeekday + 7) % 7 + (nth - 1) * 7
      return new Date(year, month - 1, 1 + daysToAdd).getDate()
    }

    const getLastWeekdayOfMonth = (year: number, month: number, weekday: number) => {
      const lastDay = new Date(year, month, 0)
      const lastDate = lastDay.getDate()
      const lastWeekday = lastDay.getDay()
      const daysBack = (lastWeekday - weekday + 7) % 7
      return lastDate - daysBack
    }

    // Martin Luther King Jr. Day (1월 셋째 월요일)
    if (month === 1 && day === getNthWeekdayOfMonth(year, 1, 1, 3)) {
      return true
    }

    // Presidents Day (2월 셋째 월요일)
    if (month === 2 && day === getNthWeekdayOfMonth(year, 2, 1, 3)) {
      return true
    }

    // Memorial Day (5월 마지막 월요일)
    if (month === 5 && day === getLastWeekdayOfMonth(year, 5, 1)) {
      return true
    }

    // Labor Day (9월 첫째 월요일)
    if (month === 9 && day === getNthWeekdayOfMonth(year, 9, 1, 1)) {
      return true
    }

    // Columbus Day (10월 둘째 월요일)
    if (month === 10 && day === getNthWeekdayOfMonth(year, 10, 1, 2)) {
      return true
    }

    // Thanksgiving (11월 넷째 목요일)
    if (month === 11 && day === getNthWeekdayOfMonth(year, 11, 4, 4)) {
      return true
    }

    return false
  }

  const getStatusColor = (appointment: AppointmentWithRelations) => {
    if (appointment.status === 'cancelled') {
      return 'bg-red-100 text-red-800 border-red-200'
    }
    if (isAppointmentCompleted(appointment)) {
      return 'bg-blue-100 text-blue-800 border-blue-200'  // Completed: 파란색
    }
    return 'bg-green-100 text-green-800 border-green-200'  // Scheduled: 초록색
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />

      {/* 상단 패널 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {t('schedule_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {format(currentDate, language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', { locale: language === 'ko' ? ko : enUS })} {t('weekly_schedule')}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('previous_week')}
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                {t('today')}
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {t('next_week')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 영역 */}
      <div className="p-3 flex-1">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
            <div className="p-3 border-r border-gray-200 text-center font-medium text-gray-600">{t('time')}</div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date())
              const isSunday = index === 0
              const isSaturday = index === 6
              const isHoliday = isUSHoliday(day)
              const dayAppointments = getAppointmentsForDate(day)

              // 텍스트 색상 결정
              let textColorClass = 'text-gray-900'
              if (isSunday || isHoliday) {
                textColorClass = 'text-red-600'
              } else if (isSaturday) {
                textColorClass = 'text-blue-600'
              }
              // 오늘 날짜도 다른 날짜와 동일한 색상 규칙 적용

              return (
                <div
                  key={index}
                  className={`p-3 text-center ${
                    isToday ? 'border-t-2 border-l-2 border-r-2 border-blue-700' : 'border-r border-gray-200 last:border-r-0'
                  }`}
                >
                  <div className={`text-sm ${isToday ? 'font-bold' : 'font-medium'} ${textColorClass}`}>
                    {format(day, 'M/d (E)', { locale: language === 'ko' ? ko : enUS })}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className={`text-xs mt-1 text-gray-500`}>
                      {dayAppointments.length}{t('appointments_count')}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 시간대별 그리드 */}
          <div className="max-h-[calc(100vh-300px)] overflow-y-auto hide-scrollbar">
            {hourBlocks.map((hour, hourIndex) => (
              <div
                key={hour}
                className="grid grid-cols-8 border-b border-gray-100 last:border-b-0"
                style={{ minHeight: '80px' }}
              >
                {/* 시간 표시 열 */}
                <div className="border-r border-gray-200 p-2 text-center text-sm text-gray-600 font-medium bg-gray-50">
                  {hour.toString().padStart(2, '0')}:00
                </div>

                {/* 각 요일별 셀 */}
                {weekDays.map((day, dayIndex) => {
                  const hourAppointments = getAppointmentsForHour(day, hour)

                  // 해당 날짜의 모든 예약으로 겹침 감지 (시간순 정렬된 상태)
                  const dayAppointments = getAppointmentsForDate(day)
                  const appointmentGroups = groupOverlappingAppointments(dayAppointments)

                  // 현재 시간대에 표시할 예약들만 필터링
                  const displayAppointments = appointmentGroups.flatMap(group =>
                    group.filter(apt => {
                      const [startHour] = apt.appointment_time.split(':').map(Number)
                      return startHour === hour
                    }).map(apt => ({ ...apt, groupSize: group.length, groupIndex: group.findIndex(g => g.id === apt.id) }))
                  )

                  const isTodayColumn = isSameDay(day, new Date())
                  const isLastHour = hourIndex === hourBlocks.length - 1

                  return (
                    <div
                      key={`${hour}-${dayIndex}`}
                      className={`relative bg-white hover:bg-gray-50 transition-colors group ${
                        isTodayColumn
                          ? `border-l-2 border-r-2 border-blue-700 ${isLastHour ? 'border-b-2' : ''}`
                          : 'border-r border-gray-200 last:border-r-0'
                      }`}
                      style={{ minHeight: '80px' }}
                    >
                      {/* 예약 추가 버튼들 */}
                      <div
                        className="absolute inset-x-0 top-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-5"
                        style={{ height: '40px' }}
                        onClick={() => handleAddAppointment(day, hour, 0)}
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>
                      <div
                        className="absolute inset-x-0 bottom-0 cursor-pointer flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-5"
                        style={{ height: '40px' }}
                        onClick={() => handleAddAppointment(day, hour, 30)}
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </div>

                      {/* 예약들 */}
                      {displayAppointments.map((appointment) => {
                        const style = calculateAppointmentStyle(appointment, appointment.groupIndex, appointment.groupSize)
                        return (
                          <div
                            key={appointment.id}
                            className={`absolute rounded-md border cursor-pointer transition-all hover:shadow-md z-10 ${getStatusColor(appointment)}`}
                            style={{
                              ...style
                            }}
                            onClick={() => handleEditAppointment(appointment)}
                          >
                            <div className="p-1 h-full overflow-hidden">
                              <div className="flex justify-between items-start mb-0.5">
                                <div className="font-medium text-xs">
                                  {appointment.appointment_time.slice(0, 5)}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteClick(appointment)
                                  }}
                                  className="p-0.5 text-gray-500 hover:text-red-600 transition-colors"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                              <div className="text-xs text-gray-700 truncate">
                                {appointment.customer?.name || t('customer_name_unknown')}
                              </div>
                              <div className="text-xs text-gray-600 truncate">
                                {appointment.services && appointment.services.length > 0 ? (
                                  appointment.services.length === 1 ? (
                                    appointment.services[0].name
                                  ) : (
                                    `${appointment.services[0].name} 외 ${appointment.services.length - 1}개`
                                  )
                                ) : (
                                  t('service_name_unknown')
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 통계 패널 */}
      <div className="bg-white border-t shadow-sm">
        <div className="px-3 py-3">
          {(() => {
            const today = new Date()
            const isCurrentWeek = weekDays.some(day => isSameDay(day, today))
            const isLastWeek = weekDays[6] < today && !isCurrentWeek
            const isNextWeek = weekDays[0] > today && !isCurrentWeek

            if (isCurrentWeek) {
              // 현재 주: This Week, Completed, Today (3개)
              return (
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('this_week_appointments')}</p>
                      <p className="text-lg font-bold text-gray-900">{appointments.length} {t('appointments_count')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('completed_appointments')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => isAppointmentCompleted(apt)).length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === 'ko' ? '예약된 건수' : 'Scheduled'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => !isAppointmentCompleted(apt) && apt.status === 'scheduled').length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            } else if (isLastWeek) {
              // 지난 주: Completed만 (1개, 왼쪽 정렬)
              return (
                <div className="flex">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('completed_appointments')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => isAppointmentCompleted(apt)).length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            } else if (isNextWeek) {
              // 다음 주: Scheduled만 (1개, 왼쪽 정렬)
              return (
                <div className="flex">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === 'ko' ? '예약된 건수' : 'Scheduled'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => !isAppointmentCompleted(apt) && apt.status === 'scheduled').length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            } else {
              // 기본값 (현재 주와 동일)
              return (
                <div className="grid grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('this_week_appointments')}</p>
                      <p className="text-lg font-bold text-gray-900">{appointments.length} {t('appointments_count')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Clock className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">{t('completed_appointments')}</p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => isAppointmentCompleted(apt)).length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Calendar className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">
                        {language === 'ko' ? '예약된 건수' : 'Scheduled'}
                      </p>
                      <p className="text-lg font-bold text-gray-900">
                        {appointments.filter(apt => !isAppointmentCompleted(apt) && apt.status === 'scheduled').length} {t('appointments_count')}
                      </p>
                    </div>
                  </div>
                </div>
              )
            }
          })()}
        </div>
      </div>

      {/* 예약 추가/수정 모달 */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTime(null)
          setSelectedAppointment(null)
        }}
        onSave={handleModalSave}
        selectedDate={selectedDate}
        appointment={selectedAppointment}
        mode={modalMode}
        initialTime={selectedTime}
      />

      {/* 삭제 확인 모달 */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        appointment={appointmentToDelete}
        loading={deleteLoading}
      />
    </div>
  )
}