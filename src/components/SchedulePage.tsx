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

  // 툴팁 상태
  const [hoveredAppointment, setHoveredAppointment] = useState<AppointmentWithRelations | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0, align: 'left' as 'left' | 'right' })

  // 이번 주 날짜들 생성
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }) // 일요일 시작
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // 시간 블록 생성 (1시간 단위: 09:00 ~ 19:00)
  const hourBlocks = []
  for (let hour = 9; hour <= 19; hour++) {
    hourBlocks.push(hour)
  }

  // 겹치는 예약이 있어도 오른쪽에 항상 남겨두는 "+" 버튼용 여백 (px, 저해상도 화면 고려해 축소)
  const ADD_BUTTON_WIDTH = 11

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

  // 툴팁 핸들러
  const handleMouseEnter = (appointment: AppointmentWithRelations, event: React.MouseEvent) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const appointmentDate = parseISO(appointment.appointment_date)

    // 현재 주의 토요일 날짜 계산
    const weekSaturday = addDays(weekStart, 6) // 일주일 시작(일요일)에서 6일 더하면 토요일
    const isSaturday = isSameDay(appointmentDate, weekSaturday)

    const position = {
      // 토요일은 박스 왼쪽에서 10px 떨어진 곳, 나머지는 오른쪽 (겹치는 예약 추가용 + 버튼 여백과 겹치지 않도록 그만큼 더 띄움)
      x: isSaturday ? rect.left - 10 : rect.right + 10 + ADD_BUTTON_WIDTH,
      y: rect.top,
      align: isSaturday ? 'right' : 'left' as 'left' | 'right' // 툴팁 정렬 방향
    }

    setTooltipPosition(position)
    setHoveredAppointment(appointment)
  }

  const handleMouseLeave = () => {
    setHoveredAppointment(null)
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
    } else if (appointment.services && appointment.services.length > 0) {
      calculatedDuration = appointment.services.reduce((sum, service) => sum + service.duration, 0)
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
    const apt2End = apt2Start + getAppointmentDuration(apt2)

    // 정확한 겹침 감지: 두 시간 구간이 실제로 겹치는 경우만
    // 한 예약이 끝나는 시간과 다른 예약이 시작하는 시간이 같으면 겹치지 않음 (<=, >= 대신 <, > 사용)
    const overlaps = apt1Start < apt2End && apt2Start < apt1End &&
                    !(apt1End === apt2Start || apt2End === apt1Start)


    return overlaps
  }


  // 겹치는 예약들을 그룹핑하고 정렬
  const groupOverlappingAppointments = (appointments: AppointmentWithRelations[]) => {
    const groups: AppointmentWithRelations[][] = []
    const processed = new Set<string>()

    for (const apt of appointments) {
      if (processed.has(apt.id)) continue

      const group = [apt]
      processed.add(apt.id)

      // 첫 번째 예약과 직접 겹치는 예약들만 찾기 (전이적 그룹핑 방지)
      for (const otherApt of appointments) {
        if (processed.has(otherApt.id)) {
          continue
        }

        // 그룹의 첫 번째 예약(apt)과 직접 겹치는 경우만 그룹에 추가
        if (isOverlapping(apt, otherApt)) {
          group.push(otherApt)
          processed.add(otherApt.id)
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

    // 너비와 위치 계산 (겹치는 예약이 있으면 나누어 배치, 오른쪽엔 항상 + 버튼용 여백을 남김)
    const width = groupSize > 1
      ? `calc((100% - ${ADD_BUTTON_WIDTH}px) / ${groupSize})`
      : `calc(100% - 4px - ${ADD_BUTTON_WIDTH}px)`
    const left = groupSize > 1
      ? `calc((100% - ${ADD_BUTTON_WIDTH}px) * ${groupIndex} / ${groupSize})`
      : '2px'

    // 문제가 되는 케이스만 디버깅 (left >= 100% 또는 비정상적인 값)
    if (groupIndex >= groupSize || (typeof left === 'string' && parseInt(left) >= 100)) {
      console.log(`🚨 POSITIONING ERROR ${appointmentTime}:`, {
        customer: appointment.customer?.name,
        groupSize,
        groupIndex,
        width,
        left,
        calculation: `(${groupIndex} / ${groupSize}) * 100% = ${(groupIndex / groupSize) * 100}%`
      })
    }

    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      width: width,
      left: left,
      minHeight: '40px',
      durationMinutes: duration
    }
  }

  // 예약 상태 계산 함수 (4단계 상태 관리)
  const getAppointmentStatus = (appointment: AppointmentWithRelations) => {
    if (appointment.status === 'cancelled') return 'cancelled'
    if (appointment.status === 'completed') return 'completed'

    const appointmentStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()

    // 시작 시간이 지났으면 auto_completed 또는 completed
    if (appointmentStart <= now) {
      // 결제 정보가 있으면 completed, 없으면 auto_completed
      if (appointment.payment_amount && appointment.payment_amount > 0) {
        return 'completed'
      } else {
        return 'auto_completed'
      }
    }

    return 'scheduled'
  }

  // 예약이 완료되었는지 확인하는 함수 (completed + auto_completed)
  const isAppointmentCompleted = (appointment: AppointmentWithRelations) => {
    const status = getAppointmentStatus(appointment)
    return status === 'completed' || status === 'auto_completed'
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
    const status = getAppointmentStatus(appointment)

    switch (status) {
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'completed':
        return 'bg-blue-100 text-blue-800 border-blue-200'  // 결제 완료: 파란색
      case 'auto_completed':
        return 'bg-blue-100 text-blue-800 border-red-500 border-2'  // 결제 미입력: 파란 배경 + 빨간 테두리
      case 'scheduled':
      default:
        return 'bg-green-100 text-green-800 border-green-200'  // 예약됨: 초록색
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />

      {/* 상단 패널 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-6 h-6 text-blue-600" />
                {t('schedule_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {format(currentDate, language === 'ko' ? 'yyyy년 M월 d일' : 'MMM d, yyyy', { locale: language === 'ko' ? ko : enUS })} {t('weekly_schedule')}
              </p>
            </div>

            {/* 주간 네비게이션 버튼들 */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentDate(addDays(currentDate, -7))}
                className="px-4 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {t('previous_week')}
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-4 py-1 text-sm text-white bg-blue-600 border border-blue-600 rounded hover:bg-blue-700 transition-colors"
              >
                {t('today')}
              </button>
              <button
                onClick={() => setCurrentDate(addDays(currentDate, 7))}
                className="px-4 py-1 text-sm text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                {t('next_week')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 캘린더 영역 */}
      <div className="flex-1 flex flex-col">
        <div className="bg-white shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1">
          {/* 요일 헤더 */}
          <div className="grid border-b border-gray-200 bg-gray-50" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
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
          <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 'calc(100vh - 280px)' }}>
            {hourBlocks.map((hour, hourIndex) => (
              <div
                key={hour}
                className="grid border-b border-gray-100 last:border-b-0"
                style={{ minHeight: '80px', gridTemplateColumns: '80px repeat(7, 1fr)' }}
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

                  // 1단계: 예약별 생명주기 기반 컬럼 배정
                  const getMinutes = (timeStr: string) => {
                    const [h, m] = timeStr.slice(0, 5).split(':').map(Number)
                    return h * 60 + m
                  }

                  const appointmentColumns = new Map<string, number>()
                  const appointmentGroupSizes = new Map<string, number>()

                  if (dayAppointments.length > 0) {
                    // Connected Components 알고리즘으로 겹치는 예약 그룹 찾기
                    const visited = new Set<string>()
                    const appointmentGroups: AppointmentWithRelations[][] = []

                    // DFS로 연결된 예약들 찾기
                    const findConnectedGroup = (startApt: AppointmentWithRelations): AppointmentWithRelations[] => {
                      const group: AppointmentWithRelations[] = []
                      const stack = [startApt]

                      while (stack.length > 0) {
                        const currentApt = stack.pop()!
                        if (visited.has(currentApt.id)) continue

                        visited.add(currentApt.id)
                        group.push(currentApt)

                        // 현재 예약과 겹치는 모든 예약들을 스택에 추가
                        for (const otherApt of dayAppointments) {
                          if (visited.has(otherApt.id)) continue

                          const currentStart = getMinutes(currentApt.appointment_time)
                          const currentEnd = currentStart + getAppointmentDuration(currentApt)
                          const otherStart = getMinutes(otherApt.appointment_time)
                          const otherEnd = otherStart + getAppointmentDuration(otherApt)

                          // 겹치는지 확인
                          if (currentStart < otherEnd && otherStart < currentEnd) {
                            stack.push(otherApt)
                          }
                        }
                      }

                      return group
                    }

                    // 모든 예약을 그룹으로 나누기
                    for (const apt of dayAppointments) {
                      if (!visited.has(apt.id)) {
                        const group = findConnectedGroup(apt)
                        appointmentGroups.push(group)
                      }
                    }

                    // 각 그룹별로 최대 동시 겹침 수 계산
                    for (const group of appointmentGroups) {
                      // 이 그룹의 모든 시작/끝 이벤트 수집
                      const events: { time: number, type: 'start' | 'end' }[] = []
                      for (const apt of group) {
                        const aptStart = getMinutes(apt.appointment_time)
                        const aptEnd = aptStart + getAppointmentDuration(apt)
                        events.push({ time: aptStart, type: 'start' })
                        events.push({ time: aptEnd, type: 'end' })
                      }

                      // 시간순 정렬
                      events.sort((a, b) => a.time - b.time)

                      // Sweep line으로 최대 동시성 계산
                      let maxConcurrent = 0
                      let currentConcurrent = 0
                      for (const event of events) {
                        if (event.type === 'start') {
                          currentConcurrent++
                          maxConcurrent = Math.max(maxConcurrent, currentConcurrent)
                        } else {
                          currentConcurrent--
                        }
                      }

                      // 이 그룹의 모든 예약에 동일한 컬럼 수 적용
                      for (const apt of group) {
                        appointmentGroupSizes.set(apt.id, maxConcurrent)
                      }
                    }

                    // 시간순으로 정렬하여 컬럼 배정
                    const sortedAppointments = [...dayAppointments].sort((a, b) =>
                      a.appointment_time.localeCompare(b.appointment_time)
                    )

                    const columnEndTimes: number[] = []

                    for (const apt of sortedAppointments) {
                      const aptStart = getMinutes(apt.appointment_time)
                      const aptEnd = aptStart + getAppointmentDuration(apt)
                      const aptGroupSize = appointmentGroupSizes.get(apt.id) || 1

                      // 이 예약의 그룹 크기 내에서 사용 가능한 컬럼 찾기
                      let assignedColumn = -1
                      for (let col = 0; col < aptGroupSize && col < columnEndTimes.length; col++) {
                        if (columnEndTimes[col] <= aptStart) {
                          assignedColumn = col
                          columnEndTimes[col] = aptEnd
                          break
                        }
                      }

                      // 사용 가능한 컬럼이 없으면 새 컬럼 생성 (그룹 크기 내에서)
                      if (assignedColumn === -1 && columnEndTimes.length < aptGroupSize) {
                        assignedColumn = columnEndTimes.length
                        columnEndTimes.push(aptEnd)
                      } else if (assignedColumn === -1) {
                        // 그룹 크기를 초과할 수 없으면 0번 컬럼 사용 (fallback)
                        assignedColumn = 0
                        columnEndTimes[0] = aptEnd
                      }

                      appointmentColumns.set(apt.id, assignedColumn)
                    }
                  }

                  // 2단계: 예약별 생명주기 기반 표시 (이미 Phase 1에서 계산됨)

                  // 이 시간대에 시작하는 예약들만 표시 (Phase 1에서 배정된 컬럼과 그룹크기 사용)
                  const displayAppointments = dayAppointments
                    .filter(apt => {
                      const [startHour] = apt.appointment_time.split(':').map(Number)
                      return startHour === hour
                    })
                    .map(apt => ({
                      ...apt,
                      groupSize: appointmentGroupSizes.get(apt.id) || 1,  // 예약별 생명주기 기반 그룹 크기
                      groupIndex: appointmentColumns.get(apt.id) || 0
                    }))


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
                        const isRightmost = appointment.groupIndex === appointment.groupSize - 1
                        const [aptHour, aptMinute] = appointment.appointment_time.slice(0, 5).split(':').map(Number)

                        // 30분 단위로 겹치는 예약 추가 슬롯 생성 (예약 소요시간만큼 분할)
                        const addSlotCount = Math.max(1, Math.round(style.durationMinutes / 30))
                        const addSlots = Array.from({ length: addSlotCount }, (_, i) => {
                          const totalMinutes = aptHour * 60 + aptMinute + i * 30
                          return { hour: Math.floor(totalMinutes / 60) % 24, minute: totalMinutes % 60 }
                        })

                        return (
                          <div
                            key={appointment.id}
                            className="absolute group/appt z-10"
                            style={{
                              top: style.top,
                              height: style.height,
                              left: style.left,
                              width: isRightmost ? `calc(${style.width} + ${ADD_BUTTON_WIDTH}px)` : style.width,
                              minHeight: style.minHeight
                            }}
                          >
                            <div
                              className={`absolute inset-y-0 left-0 rounded-md border cursor-pointer transition-all hover:shadow-md ${getStatusColor(appointment)}`}
                              style={{ width: isRightmost ? `calc(100% - ${ADD_BUTTON_WIDTH}px)` : '100%' }}
                              onClick={() => handleEditAppointment(appointment)}
                              onMouseEnter={(e) => handleMouseEnter(appointment, e)}
                              onMouseLeave={handleMouseLeave}
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
                            {isRightmost && addSlots.map((slot, slotIndex) => (
                              <div
                                key={slotIndex}
                                className="absolute right-0 flex items-center justify-center cursor-pointer opacity-0 group-hover/appt:opacity-100 hover:bg-blue-50 rounded transition-opacity z-20"
                                style={{
                                  width: `${ADD_BUTTON_WIDTH}px`,
                                  top: `${(slotIndex / addSlotCount) * 100}%`,
                                  height: `${100 / addSlotCount}%`
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddAppointment(day, slot.hour, slot.minute)
                                }}
                                title={language === 'ko' ? '같은 시간에 예약 추가' : 'Add appointment at same time'}
                              >
                                <Plus className="w-2.5 h-2.5 text-gray-400" />
                              </div>
                            ))}
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
      <div className="bg-white border-t shadow-sm -mt-px">
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

      {/* 예약 상세정보 툴팁 */}
      {hoveredAppointment && (
        <div
          className="fixed bg-white border border-gray-300 rounded-lg shadow-lg p-3 z-50 max-w-sm"
          style={{
            left: tooltipPosition.x,
            top: tooltipPosition.y,
            transform: tooltipPosition.align === 'right' ? 'translate(-100%, -50%)' : 'translateY(-50%)'
          }}
        >
          <div className="space-y-2">
            {/* 시간 */}
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-sm">
                {hoveredAppointment.appointment_time.slice(0, 5)}
              </span>
            </div>

            {/* 고객 정보 */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span className="text-sm">
                {hoveredAppointment.customer?.name || t('customer_name_unknown')}
              </span>
            </div>

            {/* 전화번호 */}
            {hoveredAppointment.customer?.phone && (
              <div className="text-sm text-gray-600 ml-6">
                📞 {hoveredAppointment.customer.phone}
              </div>
            )}

            {/* 서비스 */}
            {hoveredAppointment.services && hoveredAppointment.services.length > 0 && (
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">{t('services')}</div>
                <div className="space-y-1">
                  {hoveredAppointment.services.map((service, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{service.name}</span>
                      <span className="text-gray-600">${service.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 직원 */}
            {hoveredAppointment.staff && (
              <div className="text-sm text-gray-600">
                👨‍💼 {hoveredAppointment.staff.name}
              </div>
            )}

            {/* 메모 */}
            {hoveredAppointment.notes && (
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">{t('notes')}</div>
                <div className="text-sm text-gray-700">{hoveredAppointment.notes}</div>
              </div>
            )}

            {/* 결제 정보 */}
            {hoveredAppointment.payment_amount && (
              <div className="border-t pt-2">
                <div className="text-xs text-gray-500 mb-1">{t('payment_info')}</div>
                <div className="flex justify-between text-sm">
                  <span>
                    {hoveredAppointment.payment_method === 'cash' ? '💵 현금' : '💳 카드'}
                  </span>
                  <span className="font-medium">${hoveredAppointment.payment_amount}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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