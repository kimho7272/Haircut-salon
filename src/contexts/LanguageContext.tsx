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
    'apply': '적용',
    'search': '검색',
    'close': '닫기',
    'confirm': '확인',
    'required': '필수',
    'optional': '선택',
    'price': '가격',
    'duration': '소요시간',
    'description': '설명',
    'logout': '로그아웃',
    'logout_confirm_title': '로그아웃 확인',
    'logout_confirm_message': '정말로 로그아웃하시겠습니까?',
    'logout_warning': '현재 작업 중인 내용이 저장되지 않을 수 있습니다.',

    // 로그인 관련
    'email': '이메일',
    'password': '비밀번호',
    'welcome_to': '환영합니다',
    'sign_in_to_account': '계정에 로그인하세요',
    'management_system': '관리 시스템',
    'sign_in': '로그인',
    'signing_in': '로그인 중...',
    'login_error_empty': '이메일과 비밀번호를 모두 입력하세요',
    'login_error_invalid': '이메일 또는 비밀번호가 올바르지 않습니다',
    'login_error_failed': '로그인에 실패했습니다. 다시 시도하세요.',

    // 사이드바
    'salon_name': process.env.NEXT_PUBLIC_SALON_NAME || '미용실',
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
    'no_email': '이메일 없음',
    'delete_customer': '고객 삭제',
    'delete_customer_question': '이 고객을 삭제하시겠습니까?',
    'customer_delete_warning': '삭제된 고객 정보는 복구할 수 없습니다.',
    'customer_delete_failed': '고객 삭제에 실패했습니다.',

    // 고객 정보 폼
    'customer_info_edit': '고객 정보 수정',
    'customer_info_add': '새 고객 추가',
    'customer_name': '고객명',
    'phone_number': '전화번호',
    'special_notes': '특이사항',
    'save_failed': '고객 정보 저장에 실패했습니다.',

    // 예약 관리
    'appointment_edit': '예약 수정',
    'completed_appointment_edit': '완료된 예약 수정',
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
    'duration_label': '소요시간',
    'suggested': '권장',
    'final_duration': '최종',

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
    'role_admin_option': '관리자',
    'role_staff_option': '직원',
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
    'staff_not_specified': '담당자 미지정',
    'memo_label': '메모 (선택)',

    // 결제 정보
    'payment_method': '결재',
    'cash': '현금',
    'card': '카드',
    'payment_amount': '결제 금액',
    'payment_info': '결제 정보',

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
    'delete': '삭제',

    // 관리자 메뉴
    'admin_menu': '관리자 메뉴',
    'service_management': '서비스 관리',
    'staff_management': '직원 관리',
    'revenue_management': '매출 관리',

    // 서비스 관리
    'services_list': '서비스 목록',
    'total_services': '등록된 서비스',
    'services_count': '개',
    'add_service': '서비스 추가',
    'add_new_service': '새 서비스 추가',
    'search_services': '서비스명으로 검색...',
    'no_services': '등록된 서비스가 없습니다',
    'add_first_service': '새 서비스를 추가해보세요',
    'edit_service': '서비스 수정',
    'delete_service': '서비스 삭제',
    'service_name': '서비스명',
    'service_price': '가격',
    'service_duration': '소요시간',
    'service_description': '서비스 설명',
    'service_info_edit': '서비스 정보 수정',
    'service_info_add': '새 서비스 추가',
    'active_services': '활성 서비스',
    'inactive_services': '비활성 서비스',
    'active_service': '활성 서비스',
    'service_status': '상태',
    'activate_service': '활성화',
    'deactivate_service': '비활성화',
    'service_save_success': '서비스가 성공적으로 저장되었습니다.',
    'service_save_failed': '서비스 저장에 실패했습니다.',
    'service_delete_confirm': '이 서비스를 삭제하시겠습니까?',
    'service_delete_warning': '삭제된 서비스는 복구할 수 없습니다.',
    'service_delete_failed': '서비스 삭제에 실패했습니다.',

    // 직원 관리
    'staff_list': '직원 목록',
    'total_staff': '등록된 직원',
    'staff_count': '명',
    'add_staff': '직원 추가',
    'add_new_staff': '새 직원 추가',
    'search_staff': '직원명으로 검색...',
    'no_staff': '등록된 직원이 없습니다',
    'add_first_staff': '새 직원을 추가해보세요',
    'edit_staff': '직원 수정',
    'delete_staff': '직원 삭제',
    'staff_name': '직원명',
    'staff_username': '사용자명',
    'staff_role_label': '권한',
    'staff_info_edit': '직원 정보 수정',
    'staff_info_add': '새 직원 추가',
    'role': '권한',
    'joined_date': '입사일',
    'staff_status': '상태',
    'active_staff': '활성 직원',
    'inactive_staff': '비활성 직원',
    'activate_staff': '활성화',
    'deactivate_staff': '비활성화',
    'staff_save_success': '직원 정보가 성공적으로 저장되었습니다.',
    'staff_save_failed': '직원 정보 저장에 실패했습니다.',
    'staff_delete_confirm': '이 직원을 삭제하시겠습니까?',
    'staff_delete_warning': '삭제된 직원 정보는 복구할 수 없습니다.',
    'staff_delete_failed': '직원 삭제에 실패했습니다.',

    // 매출 관리
    'revenue_overview': '매출 현황',
    'daily_revenue': '일별 매출',
    'weekly_revenue': '주별 매출',
    'weekly_daily_revenue': '주간 일별 매출',
    'monthly_revenue': '월별 매출',
    'daily_revenue': '일별 매출',
    'revenue_by_service': '서비스별 매출',
    'revenue_by_staff': '직원별 매출',
    'total_revenue': '총 매출',
    'total_appointments': '총 예약',
    'total_completed_appointments': '완료된 예약',
    'unpaid_appointments': '결제 미입력',
    'no_unpaid_appointments': '미결제 예약이 없습니다',
    'all_appointments_paid': '모든 예약의 결제가 완료되었습니다',
    'cash_revenue': '현금 매출',
    'card_revenue': '카드 매출',
    'average_per_day': '일평균',
    'appointment_count': '예약 건수',
    'completed_only': '완료된 예약만',
    'all_appointments': '모든 예약',
    'previous_month': '이전 달',
    'current_month': '이번 달',
    'next_month': '다음 달',
    'recent_appointments': '최근 예약',
    'no_appointments': '예약이 없습니다',
    'date': '날짜',
    'customer': '고객',
    'services': '서비스',
    'revenue': '매출',
    'status': '상태',
    'completed': '완료',
    'auto_completed': '시간완료',
    'scheduled': '예약됨',
    'cancelled': '취소됨',
    'revenue_growth': '매출 증가율',
    'top_services': '인기 서비스',
    'top_staff': '우수 직원',
    'select_period': '기간 선택',
    'this_month': '이번 달',
    'last_month': '지난 달',
    'this_year': '올해',
    'custom_period': '사용자 지정',
    'from_date': '시작일',
    'to_date': '종료일',
    'select_start_date': '시작일 선택',
    'select_end_date': '종료일 선택',
    'no_revenue_data': '매출 데이터가 없습니다.',
    'revenue_chart': '매출 차트',
    'payment_methods': '결제 수단',
    'cash_payments': '현금 결제',
    'card_payments': '카드 결제',

    // 기간 선택
    'daily': '일별',
    'weekly': '주별',
    'monthly': '월별',
    'previous': '이전',
    'current': '현재',
    'next': '다음',
    'revenue_data': '매출 데이터',

    // 상태 표시
    'active': '활성',
    'inactive': '비활성',

    // Placeholder 텍스트
    'service_name_placeholder': '서비스명을 입력하세요',
    'service_description_placeholder': '서비스 설명을 입력하세요...',
    'username_placeholder': '사용자명을 입력하세요',
    'staff_name_placeholder': '직원명을 입력하세요',
    'delete_service_question': '서비스를 삭제하시겠습니까?',
    'delete_staff_question': '직원을 삭제하시겠습니까?',
    'price_and_duration': '가격 & 시간',
    'search_staff_placeholder': '직원명으로 검색...',
    'join_date': '가입일',
    'price_placeholder': '가격 (원)',
    'duration_placeholder': '소요시간 (분)'
  },
  en: {
    // 공통
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'apply': 'Apply',
    'search': 'Search',
    'close': 'Close',
    'confirm': 'Confirm',
    'required': 'Required',
    'optional': 'Optional',
    'price': 'Price',
    'duration': 'Duration',
    'description': 'Description',
    'logout': 'Logout',
    'logout_confirm_title': 'Confirm Logout',
    'logout_confirm_message': 'Are you sure you want to logout?',
    'logout_warning': 'Your current work may not be saved.',

    // 로그인 관련
    'email': 'Email',
    'password': 'Password',
    'welcome_to': 'Welcome to',
    'sign_in_to_account': 'Sign in to your account',
    'management_system': 'Management System',
    'sign_in': 'Sign in',
    'signing_in': 'Signing in...',
    'login_error_empty': 'Please enter both email and password',
    'login_error_invalid': 'Invalid email or password',
    'login_error_failed': 'Login failed. Please try again.',

    // 사이드바
    'salon_name': process.env.NEXT_PUBLIC_SALON_NAME || 'Salon',
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
    'no_email': 'No email',
    'delete_customer': 'Delete Customer',
    'delete_customer_question': 'Do you want to delete this customer?',
    'customer_delete_warning': 'Deleted customer information cannot be recovered.',
    'customer_delete_failed': 'Failed to delete customer.',

    // 고객 정보 폼
    'customer_info_edit': 'Edit Customer',
    'customer_info_add': 'Add New Customer',
    'customer_name': 'Name',
    'phone_number': 'Phone',
    'special_notes': 'Notes',
    'save_failed': 'Failed to save customer information.',

    // 예약 관리
    'appointment_edit': 'Edit Appointment',
    'completed_appointment_edit': 'Edit Completed Appointment',
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
    'duration_label': 'Duration',
    'suggested': 'Suggested',
    'final_duration': 'Final',

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
    'role_admin_option': 'Admin',
    'role_staff_option': 'Staff',
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
    'staff_not_specified': 'Staff Not Specified',
    'memo_label': 'Memo (Optional)',

    // 결제 정보
    'payment_method': 'Payment',
    'cash': 'Cash',
    'card': 'Card',
    'payment_amount': 'Payment Amount',
    'payment_info': 'Payment Info',

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
    'delete': 'Delete',

    // 관리자 메뉴
    'admin_menu': 'Admin Menu',
    'service_management': 'Services',
    'staff_management': 'Staff',
    'revenue_management': 'Revenue',

    // 서비스 관리
    'services_list': 'Services List',
    'total_services': 'Total Services',
    'services_count': 'services',
    'add_service': 'Add Service',
    'add_new_service': 'Add New Service',
    'search_services': 'Search services...',
    'no_services': 'No services registered',
    'add_first_service': 'Add your first service',
    'edit_service': 'Edit Service',
    'delete_service': 'Delete Service',
    'service_name': 'Service Name',
    'service_price': 'Price',
    'service_duration': 'Duration',
    'service_description': 'Description',
    'service_info_edit': 'Edit Service',
    'service_info_add': 'Add New Service',
    'active_services': 'Active Services',
    'inactive_services': 'Inactive Services',
    'active_service': 'Active Service',
    'service_status': 'Status',
    'activate_service': 'Activate',
    'deactivate_service': 'Deactivate',
    'service_save_success': 'Service saved successfully.',
    'service_save_failed': 'Failed to save service.',
    'service_delete_confirm': 'Are you sure you want to delete this service?',
    'service_delete_warning': 'Deleted services cannot be recovered.',
    'service_delete_failed': 'Failed to delete service.',

    // 직원 관리
    'staff_list': 'Staff List',
    'total_staff': 'Total Staff',
    'staff_count': 'staff',
    'add_staff': 'Add Staff',
    'add_new_staff': 'Add New Staff',
    'search_staff': 'Search staff...',
    'no_staff': 'No staff registered',
    'add_first_staff': 'Add your first staff',
    'edit_staff': 'Edit Staff',
    'delete_staff': 'Delete Staff',
    'staff_name': 'Staff Name',
    'staff_username': 'Username',
    'staff_role_label': 'Role',
    'staff_info_edit': 'Edit Staff',
    'staff_info_add': 'Add New Staff',
    'role': 'Role',
    'joined_date': 'Joined',
    'staff_status': 'Status',
    'active_staff': 'Active Staff',
    'inactive_staff': 'Inactive Staff',
    'activate_staff': 'Activate',
    'deactivate_staff': 'Deactivate',
    'staff_save_success': 'Staff information saved successfully.',
    'staff_save_failed': 'Failed to save staff information.',
    'staff_delete_confirm': 'Are you sure you want to delete this staff member?',
    'staff_delete_warning': 'Deleted staff information cannot be recovered.',
    'staff_delete_failed': 'Failed to delete staff member.',

    // 매출 관리
    'revenue_overview': 'Revenue Overview',
    'daily_revenue': 'Daily Revenue',
    'weekly_revenue': 'Weekly Revenue',
    'weekly_daily_revenue': 'Weekly Daily Revenue',
    'monthly_revenue': 'Monthly Revenue',
    'daily_revenue': 'Daily Revenue',
    'revenue_by_service': 'Revenue by Service',
    'revenue_by_staff': 'Revenue by Staff',
    'total_revenue': 'Total Revenue',
    'total_appointments': 'Total Appointments',
    'total_completed_appointments': 'Total Completed Appointments',
    'unpaid_appointments': 'Unpaid Appointments',
    'no_unpaid_appointments': 'No unpaid appointments',
    'all_appointments_paid': 'All appointments have been paid',
    'cash_revenue': 'Cash Revenue',
    'card_revenue': 'Card Revenue',
    'average_per_day': 'Daily Average',
    'appointment_count': 'Appointments',
    'completed_only': 'Completed Only',
    'all_appointments': 'All Appointments',
    'previous_month': 'Previous',
    'current_month': 'Current',
    'next_month': 'Next',
    'recent_appointments': 'Recent Appointments',
    'no_appointments': 'No appointments',
    'date': 'Date',
    'customer': 'Customer',
    'services': 'Services',
    'revenue': 'Revenue',
    'status': 'Status',
    'completed': 'Completed',
    'auto_completed': 'Auto Completed',
    'scheduled': 'Scheduled',
    'cancelled': 'Cancelled',
    'revenue_growth': 'Revenue Growth',
    'top_services': 'Top Services',
    'top_staff': 'Top Staff',
    'select_period': 'Select Period',
    'this_month': 'This Month',
    'last_month': 'Last Month',
    'this_year': 'This Year',
    'custom_period': 'Custom Period',
    'from_date': 'From Date',
    'to_date': 'To Date',
    'select_start_date': 'Select Start Date',
    'select_end_date': 'Select End Date',
    'no_revenue_data': 'No revenue data available.',
    'revenue_chart': 'Revenue Chart',
    'payment_methods': 'Payment Methods',
    'cash_payments': 'Cash Payments',
    'card_payments': 'Card Payments',

    // 기간 선택
    'daily': 'Daily',
    'weekly': 'Weekly',
    'monthly': 'Monthly',
    'previous': 'Previous',
    'current': 'Current',
    'next': 'Next',
    'revenue_data': 'Revenue Data',

    // 상태 표시
    'active': 'Active',
    'inactive': 'Inactive',

    // Placeholder 텍스트
    'service_name_placeholder': 'Enter service name',
    'service_description_placeholder': 'Enter service description...',
    'username_placeholder': 'Enter username',
    'staff_name_placeholder': 'Enter staff name',
    'delete_service_question': 'Are you sure you want to delete this service?',
    'delete_staff_question': 'Are you sure you want to delete this staff member?',
    'price_and_duration': 'Price & Duration',
    'search_staff_placeholder': 'Search by staff name...',
    'join_date': 'Join Date',
    'price_placeholder': 'Price',
    'duration_placeholder': 'Duration (min)'
  }
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('ko')

  useEffect(() => {
    // 로컬 스토리지에서 언어 설정 불러오기
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'ko' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    } else {
      // 기본값을 한국어로 설정하고 저장
      setLanguageState('ko')
      localStorage.setItem('language', 'ko')
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