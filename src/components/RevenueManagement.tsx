'use client'

import { useState, useEffect } from 'react'
import { Calendar, DollarSign, TrendingUp, FileText, Filter, X, Edit2 } from 'lucide-react'
import { getAppointmentsByDateRange, type AppointmentWithRelations } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'
import AppointmentModal from './AppointmentModal'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subWeeks, subMonths, subYears, getWeek } from 'date-fns'
import { ko, enUS } from 'date-fns/locale'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'

interface RevenueData {
  totalRevenue: number
  totalCompletedAppointments: number
  unpaidAppointments: number
  cashRevenue: number
  cardRevenue: number
  dailyRevenue: { [date: string]: number }
  monthlyRevenue: { [month: string]: number }
  weeklyRevenue: { [week: string]: number }
  serviceRevenue: { [service: string]: number }
  staffRevenue: { [staff: string]: number }
}

interface PeriodInfo {
  label: string
  startDate: Date
  endDate: Date
}

type PeriodType = 'daily' | 'weekly' | 'monthly'

// 매출 차트 컴포넌트 (일별/월별 대응)
interface RevenueChartProps {
  dailyRevenue?: { [date: string]: number }
  monthlyRevenue?: { [month: string]: number }
  weeklyRevenue?: { [week: string]: number }
  periodType: PeriodType
  formatCurrency: (amount: number) => string
  language?: string
  selectedPeriod?: PeriodInfo | null
}

function RevenueChart({ dailyRevenue, monthlyRevenue, weeklyRevenue, periodType, formatCurrency, language, selectedPeriod }: RevenueChartProps) {
  let completeData: any[] = []

  if (periodType === 'monthly' && monthlyRevenue) {
    // 월별 선택 시 연간 월별 데이터 표시
    const months = Object.keys(monthlyRevenue).sort()
    if (months.length === 0) return null

    // 선택된 기간의 연도 사용
    const year = selectedPeriod ? selectedPeriod.startDate.getFullYear() : new Date().getFullYear()
    for (let month = 1; month <= 12; month++) {
      const monthStr = `${year}-${String(month).padStart(2, '0')}`
      const monthName = language === 'ko'
        ? `${month}월`
        : format(new Date(year, month - 1, 1), 'MMM', { locale: enUS })

      completeData.push({
        period: monthName,
        revenue: monthlyRevenue[monthStr] || 0,
        monthNumber: month
      })
    }
  } else if (periodType === 'weekly' && weeklyRevenue && selectedPeriod) {
    // 주별 선택 시 해당 월의 주별 데이터 표시
    const year = selectedPeriod.startDate.getFullYear()
    const month = selectedPeriod.startDate.getMonth() + 1

    // 해당 월의 모든 주차 계산
    const firstDayOfMonth = new Date(year, month - 1, 1)
    const lastDayOfMonth = new Date(year, month, 0)

    let weekNumber = 1
    let currentWeekStart = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 })

    while (currentWeekStart <= lastDayOfMonth) {
      const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 })
      const weekKey = `${year}-${String(month).padStart(2, '0')}-W${weekNumber}`

      const weekLabel = language === 'ko'
        ? `${weekNumber}주차`
        : `Week ${weekNumber}`

      completeData.push({
        period: weekLabel,
        revenue: weeklyRevenue[weekKey] || 0,
        weekNumber: weekNumber
      })

      weekNumber++
      currentWeekStart = new Date(currentWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    }
  } else if (periodType === 'daily' && dailyRevenue && selectedPeriod) {
    // 일별 선택 시 해당 주차의 일별 데이터 표시
    const startDate = selectedPeriod.startDate
    const endDate = selectedPeriod.endDate

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = format(d, 'yyyy-MM-dd')
      const dayName = language === 'ko'
        ? format(d, 'E', { locale: ko })  // 일, 월, 화, 수, 목, 금, 토
        : format(d, 'EEE', { locale: enUS }) // Sun, Mon, Tue, Wed, Thu, Fri, Sat
      const dayWithDate = language === 'ko'
        ? `${format(d, 'd')}일(${dayName})`  // 예: 24일(일)
        : `${dayName} ${format(d, 'd')}`    // 예: Sun 24

      completeData.push({
        period: dayWithDate,
        revenue: dailyRevenue[dateStr] || 0,
        date: dateStr
      })
    }
  }

  if (completeData.length === 0) return null

  // 커스텀 툴팁
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800 mb-2">{label}</p>
          <p className="text-blue-600">
            <span className="font-medium">
              {periodType === 'monthly'
                ? (language === 'ko' ? '월별 매출: ' : 'Monthly Revenue: ')
                : periodType === 'weekly'
                ? (language === 'ko' ? '주별 매출: ' : 'Weekly Revenue: ')
                : (language === 'ko' ? '매출: ' : 'Revenue: ')
              }
            </span>
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="w-full bg-white">
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart
          data={completeData}
          margin={{ top: 15, right: 25, left: 40, bottom: 25 }}
        >
          <defs>
            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="1 1"
            stroke="#e5e7eb"
            strokeOpacity={0.8}
            horizontal={true}
            vertical={false}
          />
          <XAxis
            dataKey="period"
            stroke="#6b7280"
            fontSize={12}
            interval="preserveStartEnd"
            tick={{ fontWeight: 500, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <YAxis
            stroke="#6b7280"
            fontSize={12}
            tickFormatter={(value) => formatCurrency(value)}
            tick={{ fontWeight: 500, fill: '#6b7280' }}
            axisLine={{ stroke: '#d1d5db', strokeWidth: 1 }}
            tickLine={{ stroke: '#d1d5db' }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{ stroke: '#3b82f6', strokeWidth: 2, strokeOpacity: 0.5 }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="url(#colorRevenue)"
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 7, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

export default function RevenueManagement() {
  const { t, formatCurrency, language } = useLanguage()
  const [periodType, setPeriodType] = useState<PeriodType>('weekly')
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodInfo | null>(null)
  const [periods, setPeriods] = useState<PeriodInfo[]>([])
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([])
  const [revenueData, setRevenueData] = useState<RevenueData>({
    totalRevenue: 0,
    totalCompletedAppointments: 0,
    unpaidAppointments: 0,
    cashRevenue: 0,
    cardRevenue: 0,
    dailyRevenue: {},
    monthlyRevenue: {},
    weeklyRevenue: {},
    serviceRevenue: {},
    staffRevenue: {}
  })
  const [loading, setLoading] = useState(true)
  const [showUnpaidModal, setShowUnpaidModal] = useState(false)
  const [unpaidAppointments, setUnpaidAppointments] = useState<AppointmentWithRelations[]>([])
  const [editingAppointment, setEditingAppointment] = useState<AppointmentWithRelations | null>(null)
  const [showAppointmentModal, setShowAppointmentModal] = useState(false)

  useEffect(() => {
    generatePeriods()
  }, [periodType, language])

  useEffect(() => {
    fetchRevenueData()
  }, [selectedPeriod])

  // appointments 데이터가 변경되면 unpaid 목록도 업데이트
  useEffect(() => {
    if (showUnpaidModal) {
      const updatedUnpaid = appointments.filter(apt => {
        const status = getAppointmentStatus(apt)
        return status === 'auto_completed'
      })
      setUnpaidAppointments(updatedUnpaid)
    }
  }, [appointments, showUnpaidModal])

  const generatePeriods = () => {
    const today = new Date()
    const newPeriods: PeriodInfo[] = []

    if (periodType === 'daily') {
      // 현재 주 + 이전 9주 = 총 10주
      for (let i = 0; i < 10; i++) {
        const weekStart = startOfWeek(subWeeks(today, i), { weekStartsOn: 0 }) // Sunday start
        const weekEnd = endOfWeek(subWeeks(today, i), { weekStartsOn: 0 })
        const weekNum = getWeek(weekStart, { weekStartsOn: 0 })

        const weekText = language === 'ko' ? '주차' : 'week'
        const label = i === 0
          ? `${weekNum} ${weekText} (${format(weekStart, 'MM/dd', { locale: language === 'ko' ? ko : enUS })} ~ ${format(weekEnd, 'MM/dd', { locale: language === 'ko' ? ko : enUS })})`
          : `${weekNum} ${weekText} (${format(weekStart, 'MM/dd', { locale: language === 'ko' ? ko : enUS })} ~ ${format(weekEnd, 'MM/dd', { locale: language === 'ko' ? ko : enUS })})`

        newPeriods.push({
          label,
          startDate: weekStart,
          endDate: weekEnd
        })
      }
    } else if (periodType === 'weekly') {
      // 현재 월 + 이전 9개월 = 총 10개월
      for (let i = 0; i < 10; i++) {
        const monthDate = subMonths(today, i)
        const monthStart = startOfMonth(monthDate)
        const monthEnd = endOfMonth(monthDate)

        const label = format(monthDate, language === 'ko' ? 'yyyy년 M월' : 'MMM yyyy', {
          locale: language === 'ko' ? ko : enUS
        })

        newPeriods.push({
          label,
          startDate: monthStart,
          endDate: monthEnd
        })
      }
    } else if (periodType === 'monthly') {
      // 현재 년도 + 이전 9년 = 총 10년
      for (let i = 0; i < 10; i++) {
        const yearDate = subYears(today, i)
        const yearStart = startOfYear(yearDate)
        const yearEnd = endOfYear(yearDate)

        const label = format(yearDate, 'yyyy')

        newPeriods.push({
          label,
          startDate: yearStart,
          endDate: yearEnd
        })
      }
    }

    setPeriods(newPeriods)
    setSelectedPeriod(newPeriods[0] || null) // Set current period as default
  }

  const fetchRevenueData = async () => {
    if (!selectedPeriod) return

    setLoading(true)
    try {
      const startDate = format(selectedPeriod.startDate, 'yyyy-MM-dd')
      const endDate = format(selectedPeriod.endDate, 'yyyy-MM-dd')

      const data = await getAppointmentsByDateRange(startDate, endDate)

      // 모든 예약 (취소된 예약만 제외)
      const filteredAppointments = data.filter(apt => apt.status !== 'cancelled')

      setAppointments(filteredAppointments)
      calculateRevenue(filteredAppointments)
    } catch (error) {
      console.error('매출 데이터 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  // 예약 상태 계산 함수
  const getAppointmentStatus = (appointment: AppointmentWithRelations) => {
    if (appointment.status === 'cancelled') return 'cancelled'
    if (appointment.status === 'completed') return 'completed'

    const appointmentStart = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`)
    const now = new Date()

    // 시작 시간이 지났으면 auto_completed
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

  const calculateRevenue = (appointments: AppointmentWithRelations[]) => {
    let totalRevenue = 0
    let cashRevenue = 0
    let cardRevenue = 0
    const dailyRevenue: { [date: string]: number } = {}
    const monthlyRevenue: { [month: string]: number } = {}
    const weeklyRevenue: { [week: string]: number } = {}
    const serviceRevenue: { [service: string]: number } = {}
    const staffRevenue: { [staff: string]: number } = {}

    // 완료된 예약 필터링 (completed + auto_completed)
    const completedAppointments = appointments.filter(apt => {
      const status = getAppointmentStatus(apt)
      return status === 'completed' || status === 'auto_completed'
    })
    const totalCompletedAppointments = completedAppointments.length

    // auto_completed 상태 (결제 정보 미입력) 예약 수 계산
    const unpaidAppointments = appointments.filter(apt => {
      const status = getAppointmentStatus(apt)
      return status === 'auto_completed'
    }).length

    completedAppointments.forEach(appointment => {
      if (appointment.services && appointment.services.length > 0) {
        const appointmentRevenue = appointment.services.reduce((sum, service) => sum + service.price, 0)
        totalRevenue += appointmentRevenue

        // 결제 방법별 매출 (결제 정보가 있는 경우에만)
        if (appointment.payment_method && appointment.payment_amount) {
          if (appointment.payment_method === 'cash') {
            cashRevenue += appointmentRevenue
          } else if (appointment.payment_method === 'card') {
            cardRevenue += appointmentRevenue
          }
        }

        // 스태프별 매출
        const staffName = appointment.staff?.name || '미지정'
        staffRevenue[staffName] = (staffRevenue[staffName] || 0) + appointmentRevenue

        appointment.services.forEach(service => {
          // 일별 매출
          const date = appointment.appointment_date
          dailyRevenue[date] = (dailyRevenue[date] || 0) + service.price

          // 월별 매출 (연간 뷰용)
          const monthKey = date.substring(0, 7) // YYYY-MM 형태로 추출
          monthlyRevenue[monthKey] = (monthlyRevenue[monthKey] || 0) + service.price

          // 주별 매출 (월간 뷰용)
          const appointmentDate = new Date(date)
          const year = appointmentDate.getFullYear()
          const month = appointmentDate.getMonth() + 1
          const firstDayOfMonth = new Date(year, month - 1, 1)
          const weekOfMonth = Math.ceil((appointmentDate.getDate() + firstDayOfMonth.getDay()) / 7)
          const weekKey = `${year}-${String(month).padStart(2, '0')}-W${weekOfMonth}`
          weeklyRevenue[weekKey] = (weeklyRevenue[weekKey] || 0) + service.price

          // 서비스별 매출
          serviceRevenue[service.name] = (serviceRevenue[service.name] || 0) + service.price
        })
      }
    })

    setRevenueData({
      totalRevenue,
      totalCompletedAppointments,
      unpaidAppointments,
      cashRevenue,
      cardRevenue,
      dailyRevenue,
      monthlyRevenue,
      weeklyRevenue,
      serviceRevenue,
      staffRevenue
    })
  }

  const handlePeriodChange = (periodLabel: string) => {
    const period = periods.find(p => p.label === periodLabel)
    if (period) {
      setSelectedPeriod(period)
    }
  }

  // Unpaid Appointments 카드 클릭 핸들러
  const handleUnpaidClick = () => {
    const unpaid = appointments.filter(apt => {
      const status = getAppointmentStatus(apt)
      return status === 'auto_completed'
    })
    setUnpaidAppointments(unpaid)
    setShowUnpaidModal(true)
  }

  // 예약 수정 핸들러
  const handleEditAppointment = (appointment: AppointmentWithRelations) => {
    console.log('Editing appointment:', appointment)
    setEditingAppointment(appointment)
    setShowAppointmentModal(true)
    // Unpaid 모달을 닫지 않고 유지 (여러 건 처리를 위해)
  }

  // 예약 수정 완료 핸들러
  const handleAppointmentSave = async () => {
    setShowAppointmentModal(false)
    setEditingAppointment(null)
    await fetchRevenueData() // 데이터 새로고침
    // Unpaid 모달은 닫지 않고 유지하여 다음 항목 처리 가능
  }

  // 예약 모달 닫기 핸들러
  const handleAppointmentModalClose = () => {
    setShowAppointmentModal(false)
    setEditingAppointment(null)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <DollarSign className="w-6 h-6 text-blue-600" />
                {t('revenue_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedPeriod ? selectedPeriod.label : ''} {t('revenue_data')}
              </p>
            </div>
            <div className="flex gap-3">
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value as PeriodType)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="daily">{t('daily')}</option>
                <option value="weekly">{t('weekly')}</option>
                <option value="monthly">{t('monthly')}</option>
              </select>
              <select
                value={selectedPeriod?.label || ''}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm min-w-[200px]"
              >
                {periods.map((period) => (
                  <option key={period.label} value={period.label}>
                    {period.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : (
          <>
            {/* 매출 요약 카드 */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('total_revenue')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueData.totalRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('cash_revenue')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueData.cashRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('card_revenue')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(revenueData.cardRevenue)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <TrendingUp className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('total_completed_appointments')}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {revenueData.totalCompletedAppointments}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Calendar className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div
                className="bg-white rounded-lg shadow-sm border p-6 cursor-pointer hover:shadow-md transition-shadow"
                onClick={handleUnpaidClick}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{t('unpaid_appointments')}</p>
                    <p className="text-2xl font-bold text-red-600">
                      {revenueData.unpaidAppointments}
                    </p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <FileText className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* 매출 차트 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {periodType === 'monthly'
                    ? t('monthly_revenue') || 'Monthly Revenue'
                    : periodType === 'weekly'
                    ? t('weekly_revenue') || 'Weekly Revenue'
                    : periodType === 'daily'
                    ? t('daily_revenue') || 'Daily Revenue'
                    : t('daily_revenue')
                  }
                </h2>
              </div>
              <div className="px-6 py-4">
                {(periodType === 'monthly'
                  ? Object.keys(revenueData.monthlyRevenue).length === 0
                  : periodType === 'weekly'
                  ? Object.keys(revenueData.weeklyRevenue).length === 0
                  : Object.keys(revenueData.dailyRevenue).length === 0
                ) ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('no_revenue_data')}
                  </div>
                ) : (
                  <RevenueChart
                    dailyRevenue={revenueData.dailyRevenue}
                    monthlyRevenue={revenueData.monthlyRevenue}
                    weeklyRevenue={revenueData.weeklyRevenue}
                    periodType={periodType}
                    formatCurrency={formatCurrency}
                    language={language}
                    selectedPeriod={selectedPeriod}
                  />
                )}
              </div>
            </div>

            {/* 서비스별 매출 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('revenue_by_service')}
                </h2>
              </div>
              <div className="p-6">
                {Object.keys(revenueData.serviceRevenue).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('no_revenue_data')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(revenueData.serviceRevenue)
                      .sort(([,a], [,b]) => b - a)
                      .map(([service, revenue]) => {
                        const percentage = (revenue / revenueData.totalRevenue) * 100
                        return (
                          <div key={service} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-900">{service}</span>
                                <span className="text-sm text-gray-600">{formatCurrency(revenue)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

            {/* 스태프별 매출 */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="p-3 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Revenue by Staff
                </h2>
              </div>
              <div className="p-6">
                {!revenueData.staffRevenue || Object.keys(revenueData.staffRevenue).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {t('no_revenue_data')}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(revenueData.staffRevenue)
                      .sort(([,a], [,b]) => b - a)
                      .map(([staff, revenue]) => {
                        const percentage = (revenue / revenueData.totalRevenue) * 100
                        return (
                          <div key={staff} className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex justify-between items-center mb-1">
                                <span className="text-sm font-medium text-gray-900">{staff}</span>
                                <span className="text-sm text-gray-600">{formatCurrency(revenue)}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-purple-600 h-2 rounded-full"
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </div>
            </div>

          </>
        )}
      </div>

      {/* Unpaid Appointments Modal */}
      {showUnpaidModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {t('unpaid_appointments')} ({unpaidAppointments.length} {t('appointments_count')})
              </h2>
              <button
                onClick={() => setShowUnpaidModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-4">
              {unpaidAppointments.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-base font-medium text-gray-900 mb-2">
                    {t('no_unpaid_appointments')}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {t('all_appointments_paid')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidAppointments.map((appointment) => {
                    const totalRevenue = appointment.services?.reduce((sum, service) => sum + service.price, 0) || 0
                    return (
                      <div key={appointment.id} className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                              <span className="font-semibold text-gray-900 text-base">
                                {appointment.customer?.name || t('customer_name_unknown')}
                              </span>
                              <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {format(new Date(appointment.appointment_date), 'M/d')} {appointment.appointment_time.slice(0, 5)}
                              </span>
                              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                                {t('auto_completed')}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">{t('services')}:</span>
                                <span className="text-gray-900 font-medium">
                                  {appointment.services && appointment.services.length > 0 ? (
                                    appointment.services.length === 1 ? (
                                      appointment.services[0].name
                                    ) : (
                                      `${appointment.services[0].name} 외 ${appointment.services.length - 1}개`
                                    )
                                  ) : (
                                    t('no_service_info')
                                  )}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-gray-500">{t('revenue')}:</span>
                                <span className="text-gray-900 font-semibold">
                                  {formatCurrency(totalRevenue)}
                                </span>
                              </div>
                              {appointment.customer?.phone && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500">{t('phone_number')}:</span>
                                  <span className="text-gray-900">
                                    {appointment.customer.phone}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 flex-shrink-0"
                          >
                            <Edit2 className="w-4 h-4" />
                            <span className="text-sm font-medium">{t('edit')}</span>
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Appointment Edit Modal */}
      {editingAppointment && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          mode="edit"
          appointment={editingAppointment}
          selectedDate={new Date(editingAppointment.appointment_date || new Date())}
          onSave={handleAppointmentSave}
          onClose={handleAppointmentModalClose}
        />
      )}
    </div>
  )
}