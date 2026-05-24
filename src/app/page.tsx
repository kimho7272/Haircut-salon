'use client'

import { useState, useEffect } from 'react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import { ko } from 'date-fns/locale'
import { Calendar, Clock, User, Phone, Plus, Edit3, Trash2 } from 'lucide-react'
import AppointmentModal from '@/components/AppointmentModal'
import DeleteConfirmModal from '@/components/DeleteConfirmModal'
import { getAppointmentsByDateRange, deleteAppointment, type AppointmentWithRelations } from '@/utils/supabaseService'

export default function SchedulePage() {
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
      // AppointmentModal에서 초기 시간을 설정할 수 있도록 상태 추가 필요
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
  const isOverlapping = (apt1: AppointmentWithRelations, apt2: AppointmentWithRelations) => {
    const getMinutes = (timeStr: string) => {
      const [hour, minute] = timeStr.slice(0, 5).split(':').map(Number)
      return hour * 60 + minute
    }

    const apt1Start = getMinutes(apt1.appointment_time)
    const apt1End = apt1Start + apt1.service.duration
    const apt2Start = getMinutes(apt2.appointment_time)
    const apt2End = apt2Start + apt2.service.duration

    return apt1Start < apt2End && apt2Start < apt1End
  }

  // 겹치는 예약들을 그룹핑하고 정렬
  const groupOverlappingAppointments = (appointments: AppointmentWithRelations[]) => {
    const groups: AppointmentWithRelations[][] = []
    const processed = new Set<string>()

    for (const apt of appointments) {
      if (processed.has(apt.id)) continue

      const group = [apt]
      processed.add(apt.id)

      // 현재 예약과 겹치는 모든 예약 찾기
      for (const otherApt of appointments) {
        if (processed.has(otherApt.id)) continue
        if (group.some(groupApt => isOverlapping(groupApt, otherApt))) {
          group.push(otherApt)
          processed.add(otherApt.id)
        }
      }

      // 그룹 내에서 정렬: 시작시간 우선, 그다음 등록시간
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
    const duration = Math.max(appointment.service.duration, 30)
    const heightPercentage = Math.min((duration / 60) * 100, 100)

    // 너비와 위치 계산 (겹치는 예약이 있으면 나누어 배치)
    const width = groupSize > 1 ? `${100 / groupSize}%` : '100%'
    const left = groupSize > 1 ? `${(groupIndex / groupSize) * 100}%` : '0%'

    return {
      top: `${topPercentage}%`,
      height: `${heightPercentage}%`,
      width: width,
      left: left,
      minHeight: '40px'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />

      {/* 상단 패널 - 브라우저 상단 고정 */}
      <div className="fixed top-0 left-0 right-0 bg-gray-50 z-50 px-[10px] py-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              미용실 스케쥴 관리
            </h1>
            <p className="text-gray-600 mt-2">
              {format(currentDate, 'yyyy년 M월 d일', { locale: ko })} 주간 일정
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setCurrentDate(addDays(currentDate, -7))}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              이전 주
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-4 py-2 text-white bg-blue-600 border border-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              오늘
            </button>
            <button
              onClick={() => setCurrentDate(addDays(currentDate, 7))}
              className="px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              다음 주
            </button>
          </div>
        </div>
      </div>

      {/* 가운데 캘린더 영역 */}
      <div
        className="absolute top-0 left-0 right-0 bottom-0 px-[10px] flex flex-col"
        style={{
          paddingTop: '90px',
          paddingBottom: '60px'
        }}
      >
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col flex-1 mb-[10px]">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50 flex-shrink-0">
            <div className="p-2 border-r border-gray-200"></div>
            {weekDays.map((day, index) => {
              const isToday = isSameDay(day, new Date())
              const dayAppointments = getAppointmentsForDate(day)
              return (
                <div
                  key={index}
                  className={`p-2 text-center border-r border-gray-200 last:border-r-0 ${
                    isToday ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-white' : 'text-gray-900'}`}>
                    {format(day, 'M/d (EEEE)', { locale: ko })}
                  </div>
                  {dayAppointments.length > 0 && (
                    <div className={`text-xs mt-1 ${isToday ? 'text-blue-100' : 'text-gray-500'}`}>
                      {dayAppointments.length}개
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* 시간대별 그리드 */}
          <div className="flex-1 overflow-y-auto hide-scrollbar">
            {hourBlocks.map((hour) => (
              <div
                key={hour}
                className="flex border-b border-gray-100"
                style={{ height: '80px' }}
              >
                {/* 시간 표시 열 */}
                <div
                  className="border-r border-gray-200 text-sm text-gray-600 font-medium bg-gray-50 flex items-start justify-center pt-2"
                  style={{ width: '12.5%', height: '80px' }}
                >
                  <span className="text-sm font-medium">
                    {hour.toString().padStart(2, '0')}:00
                  </span>
                </div>

                {/* 각 요일별 셀 */}
                {weekDays.map((day, dayIndex) => {
                  const hourAppointments = getAppointmentsForHour(day, hour)
                  const isToday = isSameDay(day, new Date())

                  return (
                    <div
                      key={`${hour}-${dayIndex}`}
                      className="border-r border-gray-200 last:border-r-0 relative"
                      style={{
                        width: '12.5%',
                        height: '80px'
                      }}
                    >
                      {/* 시간 가이드 라인들 (10분 단위) */}
                      <div className="absolute inset-x-0 top-1/6 border-t border-gray-100 opacity-30"></div>
                      <div className="absolute inset-x-0 top-2/6 border-t border-gray-100 opacity-30"></div>
                      <div className="absolute inset-x-0 top-3/6 border-t border-gray-200 opacity-50"></div>
                      <div className="absolute inset-x-0 top-4/6 border-t border-gray-100 opacity-30"></div>
                      <div className="absolute inset-x-0 top-5/6 border-t border-gray-100 opacity-30"></div>

                      {/* 상반부 30분 영역 (00분-30분) */}
                      <div
                        className="absolute inset-x-0 top-0 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 z-5"
                        style={{ height: '50%' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddAppointment(day, hour, 0)
                        }}
                      >
                        <Plus className="w-3 h-3 text-gray-400" />
                      </div>

                      {/* 하반부 30분 영역 (30분-60분) */}
                      <div
                        className="absolute inset-x-0 bottom-0 cursor-pointer hover:bg-gray-50 transition-colors flex items-center justify-center opacity-0 hover:opacity-100 z-5"
                        style={{ height: '50%' }}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAddAppointment(day, hour, 30)
                        }}
                      >
                        <Plus className="w-3 h-3 text-gray-400" />
                      </div>

                      {/* 예약들 - 겹치는 예약 처리 */}
                      {groupOverlappingAppointments(hourAppointments).map((group, groupIdx) =>
                        group.map((appointment, aptIndex) => {
                          const style = calculateAppointmentStyle(appointment, aptIndex, group.length)
                          return (
                            <div
                              key={appointment.id}
                              className={`absolute rounded border cursor-pointer transition-all hover:shadow-md z-10 ${getStatusColor(appointment.status)}`}
                              style={{
                                ...style,
                                right: 'auto',
                                marginLeft: '2px',
                                marginRight: '2px'
                              }}
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditAppointment(appointment)
                              }}
                            >
                              <div className="p-1 h-full overflow-hidden">
                                {/* 첫 번째 줄: 시간(왼쪽) + 삭제버튼(오른쪽) */}
                                <div className="flex justify-between items-center mb-1">
                                  <div className="font-medium text-xs">
                                    {appointment.appointment_time.slice(0, 5)}
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDeleteClick(appointment)
                                    }}
                                    className="p-0.5 text-gray-500 hover:text-red-600 transition-colors flex-shrink-0"
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </button>
                                </div>
                                {/* 두 번째 줄: 고객명과 서비스명 */}
                                <div className="text-xs text-gray-700 truncate">
                                  {appointment.customer?.name || '고객명 없음'} ({appointment.service?.name || '서비스명 없음'})
                                </div>
                              </div>
                            </div>
                          )
                        })
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 통계 패널 */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-50 z-50 px-[10px] py-1 shadow-lg border-t">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded">
                <Calendar className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">이번 주 예약</p>
                <p className="text-lg font-bold text-gray-900">{appointments.length}건</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-100 rounded">
                <Clock className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">완료된 예약</p>
                <p className="text-lg font-bold text-gray-900">
                  {appointments.filter(apt => apt.status === 'completed').length}건
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-100 rounded">
                <User className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-600">오늘 예약</p>
                <p className="text-lg font-bold text-gray-900">
                  {getAppointmentsForDate(new Date()).length}건
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 예약 추가/수정 모달 */}
      <AppointmentModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedTime(null) // 모달 닫을 때 선택된 시간 초기화
          setSelectedAppointment(null) // 선택된 예약 초기화
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
    </>
  )
}