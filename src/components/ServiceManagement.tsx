'use client'

import { useState, useEffect } from 'react'
import { Search, Scissors, Plus, Edit2, X, Trash2 } from 'lucide-react'
import { getServices, saveService, updateService, deleteService, type Service } from '@/utils/supabaseService'
import { useLanguage } from '@/contexts/LanguageContext'

interface ServiceFormData {
  name: string
  price: number
  duration: number
  description: string
  active: boolean
}

export default function ServiceManagement() {
  const { t, formatCurrency } = useLanguage()
  const [services, setServices] = useState<Service[]>([])
  const [filteredServices, setFilteredServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // 모달 상태
  const [showModal, setShowModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [formData, setFormData] = useState<ServiceFormData>({
    name: '',
    price: 0,
    duration: 60,
    description: '',
    active: true
  })

  // 삭제 확인 모달 상태
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetchServices()
  }, [])

  useEffect(() => {
    filterServices()
  }, [searchTerm, services])

  const fetchServices = async () => {
    setLoading(true)
    try {
      const data = await getServices()
      setServices(data)
    } catch (error) {
      console.error('서비스 조회 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterServices = () => {
    if (!searchTerm.trim()) {
      setFilteredServices(services)
      return
    }

    const filtered = services.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    setFilteredServices(filtered)
  }

  const handleEdit = (service: Service) => {
    setEditingService(service)
    setFormData({
      name: service.name,
      price: service.price,
      duration: service.duration,
      description: service.description || '',
      active: service.active
    })
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingService(null)
    setFormData({
      name: '',
      price: 0,
      duration: 60,
      description: '',
      active: true
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingService) {
        // 서비스 정보 수정
        await updateService(editingService.id, formData)
      } else {
        // 새 서비스 추가
        await saveService(formData)
      }
      await fetchServices()
      setShowModal(false)
    } catch (error) {
      console.error('서비스 저장 실패:', error)
      alert(t('save_failed'))
    }
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingService(null)
  }

  // 삭제 관련 함수들
  const handleDelete = (service: Service) => {
    setServiceToDelete(service)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return

    setDeleteLoading(true)
    try {
      await deleteService(serviceToDelete.id)
      await fetchServices()
      setShowDeleteModal(false)
      setServiceToDelete(null)
    } catch (error) {
      console.error('서비스 삭제 실패:', error)
      alert(t('service_delete_failed'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setServiceToDelete(null)
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
                <Scissors className="w-6 h-6 text-blue-600" />
                {t('service_management')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('total_services')}: {services.length}{t('services_count')}
              </p>
            </div>
            <button
              onClick={handleAdd}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              {t('add_new_service')}
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
            placeholder={t('search_services')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* 서비스 리스트 */}
      <div className="px-6 pb-6">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Loading...</div>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="text-center py-12">
            <Scissors className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? t('no_search_results') : t('no_services')}
            </h3>
            <p className="text-gray-600">
              {searchTerm ? t('try_different_search') : t('add_first_service')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('service_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('duration')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('description')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Scissors className="w-4 h-4 text-blue-600 mr-2" />
                        <span className="font-medium text-gray-900">{service.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900 font-medium">
                      {formatCurrency(service.price)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {service.duration}{t('minutes')}
                    </td>
                    <td className="px-6 py-4 text-gray-600 max-w-xs truncate">
                      {service.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {service.active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(service)}
                          className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                          title={t('edit')}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(service)}
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

      {/* 서비스 정보 수정/추가 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-transparent flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {editingService ? t('service_info_edit') : t('service_info_add')}
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
                  {t('service_name')} *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('price')} *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={formData.price || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('duration')} ({t('minutes')}) *
                  </label>
                  <input
                    type="number"
                    required
                    min="10"
                    step="10"
                    value={formData.duration || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, duration: Number(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('description')} ({t('optional')})
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
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
                  {t('active_service')}
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
                {editingService ? t('edit') : t('add')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && serviceToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl border-2 border-gray-400 max-w-md w-full">
            {/* 헤더 */}
            <div className="flex items-center justify-between py-2 px-4 border-b border-gray-200">
              <h2 className="text-lg font-bold text-gray-900">
                {t('delete_service')}
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
                {t('delete_service_question')}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <Scissors className="w-4 h-4 text-blue-600" />
                  <span className="font-medium">{serviceToDelete.name}</span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  {t('price')}: {formatCurrency(serviceToDelete.price)} | {t('duration')}: {serviceToDelete.duration}{t('minutes')}
                </div>
              </div>
              <p className="text-red-600 text-sm">
                {t('service_delete_warning')}
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