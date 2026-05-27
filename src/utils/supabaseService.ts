import { supabase, type Appointment, type Customer, type Staff, type Service, type AppointmentService } from '@/lib/supabase'

// Extended appointment type with relation data
export type AppointmentWithRelations = Appointment & {
  customer: Customer
  staff: Staff
  services: Service[] // Changed from single service to array
}

// Helper function to save appointment services
const saveAppointmentServices = async (appointmentId: string, serviceIds: string[]) => {
  console.log('🔍 DEBUG: Saving appointment services:', { appointmentId, serviceIds })

  // Validate inputs
  if (!appointmentId || !serviceIds || serviceIds.length === 0) {
    console.error('❌ Invalid input:', { appointmentId, serviceIds })
    throw new Error('Invalid appointment ID or service IDs')
  }

  const appointmentServices = serviceIds.map(serviceId => ({
    appointment_id: appointmentId,
    service_id: serviceId
  }))

  console.log('📝 Appointment services data to insert:', appointmentServices)

  // Test table access first
  try {
    const { count, error: countError } = await supabase
      .from('appointment_services')
      .select('*', { count: 'exact', head: true })

    console.log('🔍 Table access test:', { count, error: countError })

    if (countError) {
      console.error('❌ Table access failed:', countError)
      throw countError
    }
  } catch (accessError) {
    console.error('❌ Cannot access appointment_services table:', accessError)
    throw accessError
  }

  // Try insert
  const { data, error } = await supabase
    .from('appointment_services')
    .insert(appointmentServices)

  if (error) {
    console.error('❌ Insert failed:', error)
    console.error('🔍 Full error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
      severity: error.severity
    })
    throw error
  }

  console.log('✅ Successfully saved appointment services:', data)
  return data
}

// Helper function to get appointment services
const getAppointmentServices = async (appointmentIds: string[]) => {
  if (appointmentIds.length === 0) return []

  const { data, error } = await supabase
    .from('appointment_services')
    .select(`
      appointment_id,
      service:services(id, name, price, duration, description)
    `)
    .in('appointment_id', appointmentIds)

  if (error) {
    console.error('예약 서비스 조회 실패:', error)
    return []
  }

  return data || []
}

// 모든 예약 조회
export const getAppointments = async (): Promise<AppointmentWithRelations[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, role)
    `)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('예약 조회 실패:', error)
    throw error
  }

  if (!data) return []

  // For now, use fallback: get service from single service_id field
  const appointmentsWithServices = await Promise.all(
    data.map(async (appointment) => {
      let services: Service[] = []

      // Try junction table first, then fallback to single service
      try {
        const appointmentServicesData = await getAppointmentServices([appointment.id])
        const junctionServices = appointmentServicesData
          .filter(item => item.appointment_id === appointment.id && item.service)
          .map(item => item.service!)

        if (junctionServices.length > 0) {
          services = junctionServices
          console.log(`📋 getAppointments: Loaded ${junctionServices.length} services from junction table for ${appointment.id}:`, services.map(s => s.name))
        } else if (appointment.service_id) {
          // Fallback to single service
          const { data: serviceData } = await supabase
            .from('services')
            .select('*')
            .eq('id', appointment.service_id)
            .single()
          if (serviceData) {
            services = [serviceData]
            console.log(`📋 getAppointments: Loaded single service fallback for ${appointment.id}:`, serviceData.name)
          }
        }
      } catch (error) {
        console.error('❌ Error loading services for appointment:', appointment.id, error)
      }

      const result = {
        ...appointment,
        services
      }

      // Debug final result for specific customers
      if (appointment.customer?.name === 'Seo Hyunwoo') {
        console.log('🔍 Final appointment object for Seo Hyunwoo:', {
          appointmentId: result.id,
          customer: result.customer?.name,
          time: result.appointment_time,
          services: result.services,
          serviceCount: result.services?.length,
          serviceNames: result.services?.map(s => s.name)
        })
      }

      return result
    })
  )

  return appointmentsWithServices
}

// 날짜별 예약 조회
export const getAppointmentsByDateRange = async (
  startDate: string,
  endDate: string
): Promise<AppointmentWithRelations[]> => {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, role)
    `)
    .gte('appointment_date', startDate)
    .lte('appointment_date', endDate)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true })

  if (error) {
    console.error('날짜별 예약 조회 실패:', error)
    throw error
  }

  if (!data) return []

  // For now, use fallback: get service from single service_id field
  const appointmentsWithServices = await Promise.all(
    data.map(async (appointment) => {
      let services: Service[] = []

      // Try junction table first, then fallback to single service
      try {
        const appointmentServicesData = await getAppointmentServices([appointment.id])
        const junctionServices = appointmentServicesData
          .filter(item => item.appointment_id === appointment.id && item.service)
          .map(item => item.service!)

        if (junctionServices.length > 0) {
          services = junctionServices
          console.log(`📋 Loaded ${junctionServices.length} services from junction table for ${appointment.id}`)
        } else if (appointment.service_id) {
          // Fallback to single service
          const { data: serviceData } = await supabase
            .from('services')
            .select('*')
            .eq('id', appointment.service_id)
            .single()
          if (serviceData) {
            services = [serviceData]
            console.log(`📋 Loaded single service fallback for ${appointment.id}`)
          }
        }
      } catch (error) {
        console.error('❌ Error loading services for appointment:', appointment.id, error)
      }

      return {
        ...appointment,
        services
      }
    })
  )

  return appointmentsWithServices
}

// 예약 저장 (다중 서비스 지원 with fallback)
export const saveAppointment = async (
  appointmentData: Omit<Appointment, 'id' | 'created_at'> & { service_ids?: string[] }
): Promise<AppointmentWithRelations> => {
  const { service_ids, ...baseAppointmentData } = appointmentData

  try {
    // Store only first service in service_id field (for backward compatibility)
    const firstServiceId = service_ids && service_ids.length > 0 ? service_ids[0] : null

    console.log('Saving appointment with service_id:', firstServiceId, 'and service_ids:', service_ids)

    const { data: savedAppointment, error: appointmentError } = await supabase
      .from('appointments')
      .insert([{
        ...baseAppointmentData,
        service_id: firstServiceId // Store first service as UUID, keep notes clean
      }])
      .select(`
        *,
        customer:customers(id, name, phone, email),
        staff:staff(id, name, role)
      `)
      .single()

    if (appointmentError) {
      console.error('예약 저장 실패:', appointmentError)
      console.error('Error details:', {
        message: appointmentError.message,
        details: appointmentError.details,
        hint: appointmentError.hint,
        code: appointmentError.code
      })
      throw appointmentError
    }

    // Try junction table with detailed debugging
    let services: Service[] = []
    if (service_ids && service_ids.length > 0) {
      try {
        console.log('🔄 Attempting junction table save...')
        await saveAppointmentServices(savedAppointment.id, service_ids)

        // Get services from junction table
        const appointmentServicesData = await getAppointmentServices([savedAppointment.id])
        services = appointmentServicesData
          .filter(item => item.appointment_id === savedAppointment.id && item.service)
          .map(item => item.service!)
        console.log('✅ Junction table success:', services.map(s => s.name))
      } catch (junctionError) {
        console.warn('❌ Junction table failed, using fallback:', junctionError)

        // Fallback: Get services directly
        const { data: serviceData, error: serviceError } = await supabase
          .from('services')
          .select('*')
          .in('id', service_ids)

        if (!serviceError && serviceData) {
          services = serviceData
          console.log('🔄 Fallback method used:', services.map(s => s.name))
        } else {
          console.error('❌ Even fallback failed:', serviceError)
        }
      }
    }

    return {
      ...savedAppointment,
      services
    }
  } catch (error) {
    console.error('Appointment save error:', error)
    throw error
  }
}

// 예약 업데이트 (다중 서비스 지원)
export const updateAppointment = async (
  id: string,
  updates: Partial<Appointment> & { service_ids?: string[] }
): Promise<AppointmentWithRelations | null> => {
  const { service_ids, ...baseUpdates } = updates

  // Update appointment with first service in service_id, keep notes clean
  const firstServiceId = service_ids && service_ids.length > 0 ? service_ids[0] : null

  // Clean any existing technical info from notes (legacy data)
  const cleanNotes = baseUpdates.notes ?
    baseUpdates.notes.replace(/\n?\[MULTI_SERVICES\]:.*$/, '') : undefined

  console.log('Updating appointment with service_id:', firstServiceId, 'service_ids:', service_ids)
  console.log('Update data:', baseUpdates)
  console.log('Full update data:', updates)

  const updateData: any = {
    ...baseUpdates,
    service_id: firstServiceId, // Store first service as UUID
  }

  // Only update notes if it was actually changed (preserve customer notes)
  if (cleanNotes !== undefined) {
    updateData.notes = cleanNotes
  }

  console.log('Final updateData being sent to supabase:', updateData)

  const { data: updatedAppointment, error: updateError } = await supabase
    .from('appointments')
    .update(updateData)
    .eq('id', id)
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, role)
    `)
    .single()

  if (updateError) {
    console.error('예약 업데이트 실패:', updateError)
    console.error('Error details:', JSON.stringify(updateError, null, 2))
    console.error('Update data that failed:', updateData)
    throw updateError
  }

  // Use fallback method for services display
  let services: Service[] = []
  if (service_ids !== undefined && service_ids.length > 0) {
    console.log('Update: Getting services for display...')

    // Get services directly for display
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .in('id', service_ids)

    if (!serviceError && serviceData) {
      services = serviceData
      console.log('Update: Successfully loaded services:', services.map(s => s.name))
    } else {
      console.warn('Update: Failed to load services:', serviceError)
    }
  }

  return {
    ...updatedAppointment,
    services
  }
}

// 예약 삭제
export const deleteAppointment = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('예약 삭제 실패:', error)
    throw error
  }

  return true
}

// 고객 조회
export const getCustomers = async (): Promise<Customer[]> => {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('고객 조회 실패:', error)
    throw error
  }

  return data || []
}

// 고객의 최근 방문 기록 조회
export const getCustomerHistory = async (customerId: string): Promise<AppointmentWithRelations[]> => {
  console.log('방문 기록 조회 중:', customerId) // 디버깅

  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      customer:customers(id, name, phone, email),
      staff:staff(id, name, role)
    `)
    .eq('customer_id', customerId)
    // 일단 모든 상태의 예약을 조회 (완료된 것만이 아니라)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: false })
    .limit(3)

  console.log('방문 기록 조회 결과:', { data, error }) // 디버깅

  if (error) {
    console.error('고객 방문 기록 조회 실패:', error)
    throw error
  }

  if (!data) return []

  // For now, use fallback: get service from single service_id field
  const appointmentsWithServices = await Promise.all(
    data.map(async (appointment) => {
      let services: Service[] = []

      // Try junction table first, then fallback to single service
      try {
        const appointmentServicesData = await getAppointmentServices([appointment.id])
        const junctionServices = appointmentServicesData
          .filter(item => item.appointment_id === appointment.id && item.service)
          .map(item => item.service!)

        if (junctionServices.length > 0) {
          services = junctionServices
          console.log(`📋 Loaded ${junctionServices.length} services from junction table for ${appointment.id}`)
        } else if (appointment.service_id) {
          // Fallback to single service
          const { data: serviceData } = await supabase
            .from('services')
            .select('*')
            .eq('id', appointment.service_id)
            .single()
          if (serviceData) {
            services = [serviceData]
            console.log(`📋 Loaded single service fallback for ${appointment.id}`)
          }
        }
      } catch (error) {
        console.error('❌ Error loading services for appointment:', appointment.id, error)
      }

      return {
        ...appointment,
        services
      }
    })
  )

  return appointmentsWithServices
}

// 고객 저장
export const saveCustomer = async (
  customerData: Omit<Customer, 'id' | 'created_at'>
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .insert([customerData])
    .select()
    .single()

  if (error) {
    // 중복 제약조건 위반은 정상적인 비즈니스 로직이므로 에러 로그 출력하지 않음
    const isDuplicateConstraint = error.message && (
      error.message.includes('duplicate key value violates unique constraint "unique_name_phone_with_number"') ||
      error.message.includes('duplicate key value violates unique constraint "unique_name_no_phone"')
    )

    if (!isDuplicateConstraint) {
      console.error('고객 저장 실패:', error)
      console.error('에러 세부 정보:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      })
    }

    throw error
  }

  return data
}

// 고객 정보 업데이트
export const updateCustomer = async (
  id: string,
  updates: Partial<Omit<Customer, 'id' | 'created_at'>>
): Promise<Customer> => {
  const { data, error } = await supabase
    .from('customers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('고객 정보 업데이트 실패:', error)
    throw error
  }

  return data
}

// 직원 조회 (모든 직원 - 활성/비활성 포함)
export const getStaff = async (): Promise<Staff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('직원 조회 실패:', error)
    throw error
  }

  return data || []
}

// 활성 직원만 조회 (예약 모달 등에서 사용)
export const getActiveStaff = async (): Promise<Staff[]> => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('활성 직원 조회 실패:', error)
    throw error
  }

  return data || []
}

// 서비스 조회 (모든 서비스 - 활성/비활성 포함)
export const getServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('name', { ascending: true })

  if (error) {
    console.error('서비스 조회 실패:', error)
    throw error
  }

  return data || []
}

// 활성 서비스만 조회 (예약 모달 등에서 사용)
export const getActiveServices = async (): Promise<Service[]> => {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('active', true)
    .order('name', { ascending: true })

  if (error) {
    console.error('활성 서비스 조회 실패:', error)
    throw error
  }

  return data || []
}

// 서비스 저장
export const saveService = async (
  serviceData: Omit<Service, 'id' | 'created_at'>
): Promise<Service> => {
  const { data, error } = await supabase
    .from('services')
    .insert([serviceData])
    .select()
    .single()

  if (error) {
    console.error('서비스 저장 실패:', error)
    throw error
  }

  return data
}

// 서비스 정보 업데이트
export const updateService = async (
  id: string,
  updates: Partial<Omit<Service, 'id' | 'created_at'>>
): Promise<Service> => {
  const { data, error } = await supabase
    .from('services')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('서비스 정보 업데이트 실패:', error)
    throw error
  }

  return data
}

// 직원 저장
export const saveStaff = async (
  staffData: Omit<Staff, 'id' | 'created_at'>
): Promise<Staff> => {
  const { data, error } = await supabase
    .from('staff')
    .insert([staffData])
    .select()
    .single()

  if (error) {
    console.error('직원 저장 실패:', error)
    throw error
  }

  return data
}

// 직원 정보 업데이트
export const updateStaff = async (
  id: string,
  updates: Partial<Omit<Staff, 'id' | 'created_at'>>
): Promise<Staff> => {
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('직원 정보 업데이트 실패:', error)
    throw error
  }

  return data
}

// 서비스 삭제
export const deleteService = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('services')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('서비스 삭제 실패:', error)
    throw error
  }

  return true
}

// 직원 삭제
export const deleteStaff = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('staff')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('직원 삭제 실패:', error)
    throw error
  }

  return true
}

// 고객 삭제
export const deleteCustomer = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('고객 삭제 실패:', error)
    throw error
  }

  return true
}