'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

type Language = 'ko' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  formatCurrency: (amount: number) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// 번역 데이터
const translations = {
  ko: {
    // 공통
    'save': '저장',
    'cancel': '취소',
    'delete': '삭제',
    'edit': '수정',
    'add': '추가',
    'search': '검색',
    'close': '닫기',
    'confirm': '확인',
    'required': '필수',
    'optional': '선택',
    'logout': '로그아웃',
    'logout_confirm_title': '로그아웃 확인',
    'logout_confirm_message': '정말로 로그아웃하시겠습니까?',
    'logout_warning': '현재 작업 중인 내용이 저장되지 않을 수 있습니다.',

    // 로그인 관련
    'email': '이메일',
    'password': '비밀번호',
    'login_error_empty': '이메일과 비밀번호를 모두 입력하세요',
    'login_error_invalid': '이메일 또는 비밀번호가 올바르지 않습니다',
    'login_error_failed': '로그인에 실패했습니다. 다시 시도하세요.',

    // 사이드바
    'salon_name': process.env.NEXT_PUBLIC_SALON_NAME || '미용실',
    'management_system': '관리 시스템',
    'schedule_management': '일정 관리',
    'customer_management': '고객 관리',

    // 일정 관리
    'weekly_schedule': '주간 일정',
    'previous_week': '이전 주',
    'today': '오늘',
    'next_week': '다음 주',
    'this_week_appointments': '이번 주 예약',
    'completed_appointments': '완료된 예약',
    'today_appointments': '오늘 예약',
    'appointments_count': '건',

    // 고객 관리
    'registered_customers': '등록된 고객',
    'customers_count': '명',
    'add_new_customer': '새 고객 추가',
    'search_placeholder': '이름 또는 전화번호로 검색...',
    'no_search_results': '검색 결과가 없습니다',
    'no_customers': '등록된 고객이 없습니다',
    'try_different_search': '다른 검색어로 시도해보세요',
    'add_first_customer': '새 고객을 추가해보세요',
    'registration_date': '등록일',
    'no_phone': '전화번호 없음',

    // 고객 정보 폼
    'customer_info_edit': '고객 정보 수정',
    'customer_info_add': '새 고객 추가',
    'customer_name': '고객명',
    'phone_number': '전화번호',
    'email': '이메일',
    'special_notes': '특이사항',
    'save_failed': '고객 정보 저장에 실패했습니다.',

    // 예약 관리
    'appointment_edit': '예약 수정',
    'appointment_add': '새 예약 추가',
    'customer_info': '고객 정보',
    'search_customer_placeholder': '고객명 또는 전화번호 검색...',
    'customer_not_found': '고객을 찾을 수 없습니다.',
    'recent_visits': '최근 방문 기록',
    'no_visit_history': '방문 기록이 없습니다',
    'loading_history': '기록을 불러오는 중...',
    'register_new_customer': '새 고객 등록',
    'date_time': '날짜/시간',
    'time': '시간',
    'select_date': '날짜 선택',
    'service': '서비스',
    'select_service': '서비스 선택',
    'staff': '담당자',
    'staff_optional': '담당자 (선택)',
    'select_staff': '담당자 선택',
    'memo': '메모',
    'memo_optional': '메모 (선택)',

    // 예약 정보
    'customer_name_unknown': '고객명 없음',
    'service_name_unknown': '서비스명 없음',

    // 요일
    'sunday': '일',
    'monday': '월',
    'tuesday': '화',
    'wednesday': '수',
    'thursday': '목',
    'friday': '금',
    'saturday': '토',

    // 예약 모달
    'appointment_edit_title': '예약 수정',
    'appointment_add_title': '새 예약 추가',
    'search_customer_name_phone': '고객명 또는 전화번호 검색...',
    'no_phone_number': '전화번호 없음',
    'no_service_info': '서비스 정보 없음',
    'customer_name_label': '고객명',
    'phone_number_optional': '전화번호 (선택)',
    'email_optional': '이메일 (선택)',
    'notes_optional': '특이사항 (선택)',
    'date_selection': '날짜 선택',
    'saving': '저장 중...',
    'update': '수정',
    'admin_role': '관리자',
    'staff_role': '직원',
    'notes_placeholder': '특이사항이나 요청사항을 입력해주세요...',
    'select_service_required': '서비스를 선택해주세요.',
    'appointment_update_failed': '예약 수정에 실패했습니다.',
    'select_customer_required': '고객을 선택해주세요.',
    'appointment_save_failed': '예약 저장에 실패했습니다.',
    'error_code': '오류 코드',
    'customer_info_label': '고객 정보',
    'new_customer_register': '새 고객 등록',
    'date_time_label': '날짜/시간',
    'service_label': '서비스',
    'service_selection': '서비스 선택',
    'staff_label': '담당자 (선택)',
    'staff_selection': '담당자 선택',
    'memo_label': '메모 (선택)',
    'recent_visits': '최근 방문 기록',
    'visits_count': '건',
    'minutes': '분',
    'new_customer_info': '새 고객 정보',

    // 삭제 확인 모달
    'delete_appointment_confirm': '예약 삭제 확인',
    'delete_appointment_question': '다음 예약을 삭제하시겠습니까?',
    'customer_name_unknown': '고객명 없음',
    'service_name_unknown': '서비스명 없음',
    'staff_abbreviation': '직',
    'memo_label_colon': '메모:',
    'delete_warning': '삭제된 예약은 복구할 수 없습니다.',
    'deleting': '삭제 중...',
    'delete': '삭제'
  },
  en: {
    // 공통
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'close': 'Close',
    'confirm': 'Confirm',
    'required': 'Required',
    'optional': 'Optional',
    'logout': 'Logout',
    'logout_confirm_title': 'Confirm Logout',
    'logout_confirm_message': 'Are you sure you want to logout?',
    'logout_warning': 'Your current work may not be saved.',

    // 로그인 관련
    'email': 'Email',
    'password': 'Password',
    'login_error_empty': 'Please enter both email and password',
    'login_error_invalid': 'Invalid email or password',
    'login_error_failed': 'Login failed. Please try again.',

    // 사이드바
    'salon_name': process.env.NEXT_PUBLIC_SALON_NAME || 'Salon',
    'management_system': 'Management System',
    'schedule_management': 'Schedule',
    'customer_management': 'Customers',

    // 일정 관리
    'weekly_schedule': 'Weekly Schedule',
    'previous_week': 'Previous',
    'today': 'Today',
    'next_week': 'Next',
    'this_week_appointments': 'This Week',
    'completed_appointments': 'Completed',
    'today_appointments': 'Today',
    'appointments_count': 'appointments',

    // 고객 관리
    'registered_customers': 'Registered Customers',
    'customers_count': 'customers',
    'add_new_customer': 'Add New Customer',
    'search_placeholder': 'Search by name or phone...',
    'no_search_results': 'No search results',
    'no_customers': 'No customers registered',
    'try_different_search': 'Try a different search term',
    'add_first_customer': 'Add your first customer',
    'registration_date': 'Registered',
    'no_phone': 'No phone',

    // 고객 정보 폼
    'customer_info_edit': 'Edit Customer',
    'customer_info_add': 'Add New Customer',
    'customer_name': 'Name',
    'phone_number': 'Phone',
    'email': 'Email',
    'special_notes': 'Notes',
    'save_failed': 'Failed to save customer information.',

    // 예약 관리
    'appointment_edit': 'Edit Appointment',
    'appointment_add': 'New Appointment',
    'customer_info': 'Customer',
    'search_customer_placeholder': 'Search customer name or phone...',
    'customer_not_found': 'Customer not found.',
    'recent_visits': 'Recent Visits',
    'no_visit_history': 'No visit history',
    'loading_history': 'Loading history...',
    'register_new_customer': 'Register New Customer',
    'date_time': 'Date/Time',
    'time': 'Time',
    'select_date': 'Select Date',
    'service': 'Service',
    'select_service': 'Select Service',
    'staff': 'Staff',
    'staff_optional': 'Staff (Optional)',
    'select_staff': 'Select Staff',
    'memo': 'Memo',
    'memo_optional': 'Memo (Optional)',

    // 예약 정보
    'customer_name_unknown': 'Unknown Customer',
    'service_name_unknown': 'Unknown Service',

    // 요일
    'sunday': 'Sun',
    'monday': 'Mon',
    'tuesday': 'Tue',
    'wednesday': 'Wed',
    'thursday': 'Thu',
    'friday': 'Fri',
    'saturday': 'Sat',

    // 예약 모달
    'appointment_edit_title': 'Edit Appointment',
    'appointment_add_title': 'New Appointment',
    'search_customer_name_phone': 'Search by name or phone...',
    'no_phone_number': 'No phone',
    'no_service_info': 'No service info',
    'customer_name_label': 'Customer Name',
    'phone_number_optional': 'Phone (Optional)',
    'email_optional': 'Email (Optional)',
    'notes_optional': 'Notes (Optional)',
    'date_selection': 'Select Date',
    'saving': 'Saving...',
    'update': 'Update',
    'admin_role': 'Admin',
    'staff_role': 'Staff',
    'notes_placeholder': 'Enter special requests or notes...',
    'select_service_required': 'Please select a service.',
    'appointment_update_failed': 'Failed to update appointment.',
    'select_customer_required': 'Please select a customer.',
    'appointment_save_failed': 'Failed to save appointment.',
    'error_code': 'Error code',
    'customer_info_label': 'Customer',
    'new_customer_register': 'Register New Customer',
    'date_time_label': 'Date/Time',
    'service_label': 'Service',
    'service_selection': 'Select Service',
    'staff_label': 'Staff (Optional)',
    'staff_selection': 'Select Staff',
    'memo_label': 'Memo (Optional)',
    'recent_visits': 'Recent Visits',
    'visits_count': 'visits',
    'minutes': 'min',
    'new_customer_info': 'New Customer Info',

    // 삭제 확인 모달
    'delete_appointment_confirm': 'Delete Appointment',
    'delete_appointment_question': 'Are you sure you want to delete this appointment?',
    'customer_name_unknown': 'Unknown Customer',
    'service_name_unknown': 'Unknown Service',
    'staff_abbreviation': 'S',
    'memo_label_colon': 'Memo:',
    'delete_warning': 'Deleted appointments cannot be recovered.',
    'deleting': 'Deleting...',
    'delete': 'Delete'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko')

  useEffect(() => {
    // 로컬 스토리지에서 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key
  }

  const formatCurrency = (amount: number): string => {
    const currency = process.env.NEXT_PUBLIC_CURRENCY || 'USD'

    if (currency === 'KRW') {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount)
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(amount)
    }
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatCurrency }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}