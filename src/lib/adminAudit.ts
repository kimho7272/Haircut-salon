import { supabaseAdmin } from '@/lib/supabase-admin'

export type AuditAction =
  | 'salon_created'
  | 'plan_changed'
  | 'status_changed'
  | 'notes_updated'
  | 'staff_invited'
  | 'staff_removed'
  | 'operator_added'
  | 'operator_removed'

// 운영자 콘솔 활동 로그 기록. 실패해도 본 작업(가입/초대 등)을 막으면 안 되므로
// 에러는 콘솔에만 남기고 조용히 삼킨다.
export const logAdminEvent = async (params: {
  actorUserId: string | null
  actorType: 'platform_admin' | 'system'
  action: AuditAction
  targetSalonId?: string | null
  detail?: Record<string, unknown>
}) => {
  try {
    await supabaseAdmin.from('platform_audit_log').insert([{
      actor_user_id: params.actorUserId,
      actor_type: params.actorType,
      action: params.action,
      target_salon_id: params.targetSalonId ?? null,
      detail: params.detail ?? null,
    }])
  } catch (error) {
    console.error('감사 로그 기록 실패:', error)
  }
}
