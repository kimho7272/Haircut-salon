'use client'

import { useState, useEffect } from 'react'
import { Search, UserCog, Plus, Edit2, X, Trash2, KeyRound, Mail } from 'lucide-react'
import { getStaff, saveStaff, updateStaff, deleteStaff, getSalonMembers, type Staff } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

interface StaffFormData {
  name: string
  role: 'admin' | 'staff'
  active: boolean
}

export default function StaffManagement() {
  const { t } = useLanguage()
  const { salon, refreshSalon } = useAuth()
  const [staff, setStaff] = useState<Staff[]>([])
  const [filteredStaff, setFilteredStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 로그인 계정(좌석) 관련 상태
  const [members, setMembers] = useState<{ id: string; name: string; role: 'admin' | 'staff'; user_id: string; contact_email: string }[]>([])
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteForm, setInviteForm] = useState({ name: '', email: '' })
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState('')
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [inviteLinkFallback, setInviteLinkFallback] = useState<string | null>(null)
  const [upgradeLoading, setUpgradeLoading] = useState(false)
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  const seatLimitReached = salon?.plan === 'free' && members.length >= 1

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const data = await getSalonMembers()
      setMembers(data)
    } catch (error) {
      console.error('계정 목록 조회 실패:', error)
    }
  }

  const openInviteModal = () => {
    setInviteForm({ name: '', email: '' })
    setInviteError('')
    setInviteSuccess(false)
    setInviteLinkFallback(null)
    setShowInviteModal(true)
  }

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/staff-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(inviteForm)
      })
      const result = await response.json()

      if (result.error === 'email_not_sent') {
        // 계정은 만들어졌지만 메일 발송만 실패한 경우 — 링크를 직접 전달할 수 있게 보여줌
        setInviteLinkFallback(result.inviteLink || null)
        setInviteSuccess(true)
        await fetchMembers()
        return
      }

      if (!response.ok) {
        if (result.error === 'seat_limit_reached') {
          setInviteError(t('seat_limit_upgrade_prompt'))
        } else if (result.error === 'email_taken') {
          setInviteError(t('invite_error_email_taken'))
        } else {
          setInviteError(t('invite_error_generic'))
        }
        return
      }

      setInviteSuccess(true)
      await fetchMembers()
    } catch (error) {
      setInviteError(t('invite_error_generic'))
    } finally {
      setInviteLoading(false)
    }
  }

  const handleRemoveMember = async (userId: string) => {
    if (!confirm(t('remove_account_confirm_question'))) return

    setRemovingUserId(userId)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/staff-remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ userId })
      })
      const result = await response.json()

      if (!response.ok) {
        if (result.error === 'cannot_remove_owner') {
          alert(t('remove_account_cannot_remove_owner'))
        } else {
          alert(t('remove_account_failed'))
        }
        return
      }

      await fetchMembers()
    } catch (error) {
      alert(t('remove_account_failed'))
    } finally {
      setRemovingUserId(null)
    }
  }

  const handleUpgradeClick = async () => {
    setUpgradeLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session?.access_token}` }
      })
      const result = await response.json()

      if (!response.ok || !result.url) {
        alert(t('billing_not_configured'))
        return
      }

      window.location.href = result.url
    } catch (error) {
      alert(t('billing_not_configured'))
    } finally {
      setUpgradeLoading(false)
    }
  }

  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null)
  const [formData, setFormData] = useState<StaffFormData>({
    name: '',
    role: 'staff',
    active: true
  })

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchStaff()
  }, [])

  useEffect(() => {
    filterStaff()
  }, [searchTerm, staff])

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const data = await getStaff()
      setStaff(data)
    } catch (error) {
      console.error('직원 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterStaff = () => {
    if (!searchTerm.trim()) {
      setFilteredStaff(staff)
      return
    }

    const filtered = staff.filter(member =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredStaff(filtered)
  }

  const handleEdit = (member: Staff) => {
    setEditingStaff(member)
    setFormData({
      name: member.name,
      role: member.role,
      active: member.active
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingStaff(null)
    setFormData({
      name: '',
      role: 'staff',
      active: true
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingStaff) {
        // 직원 정보 수정
        await updateStaff(editingStaff.id, formData)
      } else {
        // 새 직원 추가
        await saveStaff(formData)
      }
      await fetchStaff()
      setShowModal(false)
    } catch (error) {
      console.error('직원 저장 실패:', error)
      alert(t('save_failed'))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingStaff(null)
  }

  // 삭제 관련 함수들
  const handleDelete = (member: Staff) => {
    setStaffToDelete(member)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!staffToDelete) return

    setDeleteLoading(true)
    try {
      await deleteStaff(staffToDelete.id)
      await fetchStaff()
      setShowDeleteModal(false)
      setStaffToDelete(null)
    } catch (error) {
      console.error('직원 삭제 실패:', error)
      alert(t('staff_delete_failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setStaffToDelete(null)
    setDeleteLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-3 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <UserCog className="w-6 h-6 text-blue-600" />
                {t('staff_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('total_staff')}: {staff.length}{t('staff_count')}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('add_new_staff')}
            </button>
          </div>
        </div>
      </div>

      {/* 로그인 계정(좌석) 관리 */}
      <div className="px-3 py-3">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-gray-900">{t('login_accounts_section')}</h2>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                salon?.plan === 'paid' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
              }`}>
                {salon?.plan === 'paid' ? t('plan_paid') : t('plan_free')}
              </span>
              <span className="text-sm text-gray-600">
                {t('seats_used')}: {members.length}
              </span>
            </div>
            {seatLimitReached ? (
              <button
                onClick={handleUpgradeClick}
                disabled={upgradeLoading}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors text-sm"
              >
                {t('upgrade_button')}
              </button>
            ) : (
              <button
                onClick={openInviteModal}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                {t('invite_staff_account')}
              </button>
            )}
          </div>
          {seatLimitReached && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
              {t('seat_limit_reached_title')} — {t('seat_limit_upgrade_prompt')}
            </p>
          )}

          {members.length > 0 && (
            <div className="mt-3 divide-y divide-gray-100 border-t border-gray-100">
              {members.map(member => {
                const isOwner = salon?.owner_user_id === member.user_id
                return (
                  <div key={member.id} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">{member.name}</span>
                      <span className="text-xs text-gray-500">{member.contact_email}</span>
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
                        member.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role === 'admin' ? t('admin_role') : t('staff_role')}
                      </span>
                      {isOwner && (
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-100 text-gray-600">
                          {t('owner_badge')}
                        </span>
                      )}
                    </div>
                    {!isOwner && (
                      <button
                        onClick={() => handleRemoveMember(member.user_id)}
                        disabled={removingUserId === member.user_id}
                        className="text-red-600 hover:text-red-800 disabled:opacity-50 text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {removingUserId === member.user_id ? t('removing') : t('remove_account')}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_staff')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 직원 리스트 */}
      <div className="px-3 pb-3">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12">
            <UserCog className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('no_search_results') : t('no_staff')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t('try_different_search') : t('add_first_staff')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('staff_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('role')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('joined_date')}
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStaff.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserCog className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900 text-sm">{member.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.role === 'admin'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {member.role === 'admin' ? t('admin_role') : t('staff_role')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        member.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {member.active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {new Date(member.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(member)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(member)}
                          className="text-red-600 hover:text-red-800 transition-colors p-1"
                          title={t('delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 직원 정보 수정/추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingStaff ? t('staff_info_edit') : t('staff_info_add')}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('staff_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('role')} *
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as 'admin' | 'staff' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="staff">{t('staff_role')}</option>
                  <option value="admin">{t('admin_role')}</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="active" className="ml-2 text-sm text-gray-700">
                  {t('active_staff')}
                </label>
              </div>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {editingStaff ? t('edit') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && staffToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {t('delete_staff')}
              </h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 내용 */}
            <div className="px-3 py-4">
              <p className="text-gray-700 mb-4">
                {t('delete_staff_question')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <UserCog className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{staffToDelete.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('role')}: {staffToDelete.role === 'admin' ? t('admin_role') : t('staff_role')}
                  <span className="ml-3">
                    {t('joined_date')}: {new Date(staffToDelete.created_at).toLocaleDateString('ko-KR')}
                  </span>
                </div>
              </div>
              <p className="text-red-600 text-sm">
                {t('staff_delete_warning')}
              </p>
            </div>

            {/* 버튼 */}
            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                type="button"
                onClick={handleDeleteCancel}
                className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={deleteLoading}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                disabled={deleteLoading}
              >
                {deleteLoading ? t('deleting') : t('delete')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 직원 계정 초대 모달 */}
      {showInviteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">{t('invite_staff_modal_title')}</h2>
              <button
                onClick={() => setShowInviteModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {inviteSuccess ? (
              <div className="px-6 py-6 text-center space-y-4">
                <p className="text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-3">
                  {t('invite_success')}
                </p>
                {salon?.slug && (
                  <p className="text-xs text-gray-500">
                    {t('invite_login_url_hint')}: <span className="font-mono">salon.ryansuite.com/{salon.slug}</span>
                  </p>
                )}
                {inviteLinkFallback && (
                  <div className="text-left bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    <p className="text-xs text-amber-700 mb-1">{t('invite_email_not_sent')}</p>
                    <p className="text-xs break-all font-mono text-gray-700">{inviteLinkFallback}</p>
                  </div>
                )}
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('close')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="px-6 py-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('invite_staff_name_label')} *
                  </label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      required
                      value={inviteForm.name}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('email')} *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      required
                      value={inviteForm.email}
                      onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {inviteError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-sm">
                    {inviteError}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowInviteModal(false)}
                    className="flex-1 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {inviteLoading ? t('invite_sending') : t('invite_submit')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}