'use client'

import { useState, useEffect } from 'react'
import { Search, User, Phone, Mail, FileText, Edit2, Plus, Users, X, Trash2 } from 'lucide-react'
import { getCustomers, saveCustomer, updateCustomer, deleteCustomer, type Customer } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'

interface CustomerFormData {
  name: string
  phone: string
  email: string
  notes: string
}

export default function CustomerManagement() {
  const { t } = useLanguage()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchCustomers()
  }, [])

  useEffect(() => {
    filterCustomers()
  }, [searchTerm, customers])

  const fetchCustomers = async () => {
    setLoading(true)
    try {
      const data = await getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('고객 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterCustomers = () => {
    if (!searchTerm.trim()) {
      setFilteredCustomers(customers)
      return
    }

    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (customer.phone && customer.phone.includes(searchTerm))
    )
    setFilteredCustomers(filtered)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      notes: customer.notes || ''
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormData({
      name: '',
      phone: '',
      email: '',
      notes: ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingCustomer) {
        // 고객 정보 수정
        await updateCustomer(editingCustomer.id, formData)
      } else {
        // 새 고객 추가
        await saveCustomer(formData)
      }
      await fetchCustomers()
      setShowModal(false)
    } catch (error) {
      console.error('고객 저장 실패:', error)
      alert(t('save_failed'))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingCustomer(null)
  }

  // 삭제 관련 함수들
  const handleDelete = (customer: Customer) => {
    setCustomerToDelete(customer)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!customerToDelete) return

    setDeleteLoading(true)
    try {
      await deleteCustomer(customerToDelete.id)
      await fetchCustomers()
      setShowDeleteModal(false)
      setCustomerToDelete(null)
    } catch (error) {
      console.error('고객 삭제 실패:', error)
      alert(t('customer_delete_failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setCustomerToDelete(null)
    setDeleteLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-6 h-6 text-blue-600" />
                {t('customer_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('registered_customers')}: {customers.length}{t('customers_count')}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('add_new_customer')}
            </button>
          </div>
        </div>
      </div>

      {/* 검색 영역 */}
      <div className="px-6 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder={t('search_placeholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 고객 리스트 */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('no_search_results') : t('no_customers')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t('try_different_search') : t('add_first_customer')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('customer_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('phone_number')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('email')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('special_notes')}
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-bold text-gray-500 uppercase tracking-wider">
                    {t('registration_date')}
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900 text-sm">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 text-sm">
                      {customer.phone ? (
                        <div className="flex items-center">
                          <Phone className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.phone}
                        </div>
                      ) : (
                        <span className="text-gray-400">{t('no_phone_number')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 text-sm">
                      {customer.email ? (
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 text-gray-400 mr-2" />
                          <span className="truncate max-w-xs">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">{t('no_email')}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm max-w-xs truncate">
                      {customer.notes ? (
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 text-gray-400 mr-2" />
                          {customer.notes}
                        </div>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 text-sm">
                      {new Date(customer.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(customer)}
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

      {/* 고객 정보 수정/추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingCustomer ? t('customer_info_edit') : t('customer_info_add')}
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
                  {t('customer_name')} *
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
                  {t('phone_number')} ({t('optional')})
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('email')} ({t('optional')})
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('special_notes')} ({t('optional')})
                </label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                {editingCustomer ? t('edit') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && customerToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {t('delete_customer')}
              </h2>
              <button
                onClick={handleDeleteCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 내용 */}
            <div className="px-6 py-4">
              <p className="text-gray-700 mb-4">
                {t('delete_customer_question')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{customerToDelete.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {[
                    customerToDelete.phone && `${t('phone_number')}: ${customerToDelete.phone}`,
                    customerToDelete.email && `${t('email')}: ${customerToDelete.email}`,
                    `${t('registration_date')}: ${new Date(customerToDelete.created_at).toLocaleDateString('ko-KR')}`
                  ].filter(Boolean).join(' | ')}
                </div>
              </div>
              <p className="text-red-600 text-sm">
                {t('customer_delete_warning')}
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
    </div>
  )
}