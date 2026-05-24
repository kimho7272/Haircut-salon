import { supabase } from '@/lib/supabase'
import { SERVICES } from '@/config/services'
import { STAFF } from '@/config/staff'

// 서비스 데이터를 Supabase로 마이그레이션
export const migrateServices = async () => {
  console.log('서비스 데이터 마이그레이션 시작...')

  try {
    const serviceData = SERVICES.map(service => ({
      id: service.id,
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || '',
      active: service.active
    }))

    const { data, error } = await supabase
      .from('services')
      .upsert(serviceData, { onConflict: 'id' })

    if (error) {
      console.error('서비스 마이그레이션 실패:', error)
      throw error
    }

    console.log('서비스 마이그레이션 완료:', data)
    return data
  } catch (error) {
    console.error('서비스 마이그레이션 중 오류:', error)
    throw error
  }
}

// 직원 데이터를 Supabase로 마이그레이션
export const migrateStaff = async () => {
  console.log('직원 데이터 마이그레이션 시작...')

  try {
    const staffData = STAFF.map(staff => ({
      id: staff.id,
      username: staff.id, // id를 username으로 사용
      name: staff.name,
      role: staff.role,
      active: staff.active
    }))

    const { data, error } = await supabase
      .from('staff')
      .upsert(staffData, { onConflict: 'id' })

    if (error) {
      console.error('직원 마이그레이션 실패:', error)
      throw error
    }

    console.log('직원 마이그레이션 완료:', data)
    return data
  } catch (error) {
    console.error('직원 마이그레이션 중 오류:', error)
    throw error
  }
}

// 샘플 고객 데이터 생성
export const createSampleCustomers = async () => {
  console.log('샘플 고객 데이터 생성 시작...')

  try {
    const sampleCustomers = [
      {
        id: 'customer1',
        name: '김고객',
        phone: '010-1234-5678',
        email: 'kim@example.com'
      },
      {
        id: 'customer2',
        name: '이고객',
        phone: '010-2345-6789',
        email: 'lee@example.com'
      },
      {
        id: 'customer3',
        name: 'Gayeon Kim',
        phone: '010-3456-7890',
        email: 'gayeon@example.com'
      },
    ]

    const { data, error } = await supabase
      .from('customers')
      .upsert(sampleCustomers, { onConflict: 'id' })

    if (error) {
      console.error('샘플 고객 생성 실패:', error)
      throw error
    }

    console.log('샘플 고객 생성 완료:', data)
    return data
  } catch (error) {
    console.error('샘플 고객 생성 중 오류:', error)
    throw error
  }
}

// 전체 데이터 마이그레이션 실행
export const migrateAllData = async () => {
  console.log('전체 데이터 마이그레이션 시작...')

  try {
    await migrateServices()
    await migrateStaff()
    await createSampleCustomers()

    console.log('✅ 모든 데이터 마이그레이션 완료!')
    return true
  } catch (error) {
    console.error('❌ 데이터 마이그레이션 실패:', error)
    throw error
  }
}

// 브라우저 콘솔에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).migrateData = {
    services: migrateServices,
    staff: migrateStaff,
    customers: createSampleCustomers,
    all: migrateAllData
  }
}