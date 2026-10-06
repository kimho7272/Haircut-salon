'use client'

import { useState, useEffect } from 'react'
import { Users, Plus, Trash2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAdminSession } from '../AdminSessionContext'

type Operator = {
  user_id: string
  email: string | null
  created_at: string
}

export default function AdminOperatorsPage() {
  const { t } = useLanguage()
  const { session } = useAdminSession()
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const fetchOperators = async () => {
    const response = await fetch('/api/admin/operators', {
      headers: { Authorization: `Bearer ${session.access_token}` }
    })
    if (response.ok) {
      const result = await response.json()
      setOperators(result.operators)
    }
    setLoading(false)
  }

  useEffect(() => { fetchOperators() }, [])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setAdding(true)
    setError('')

    const response = await fetch('/api/admin/operators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ email: newEmail.trim() })
    })
    const result = await response.json()

    if (!response.ok) {
      if (result.error === 'user_not_found') setError(t('admin_operator_not_found'))
      else if (result.error === 'already_operator') setError(t('admin_operator_already'))
      else setError(t('admin_update_failed'))
      setAdding(false)
      return
    }

    setNewEmail('')
    await fetchOperators()
    setAdding(false)
  }

  const handleRemove = async (userId: string) => {
    if (!confirm(t('admin_remove_operator') + '?')) return
    setRemovingId(userId)
    const response = await fetch('/api/admin/operators', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ userId })
    })
    if (response.ok) {
      await fetchOperators()
    } else {
      const result = await response.json().catch(() => ({}))
      alert(result.error === 'cannot_remove_self' ? t('admin_cannot_remove_self') : t('admin_update_failed'))
    }
    setRemovingId(null)
  }

  return (
    <div className="p-6 space-y-4 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Users className="w-5 h-5 text-gray-500" />
        {t('admin_operators_title')} ({operators.length})
      </h1>

      <form onSubmit={handleAdd} className="bg-white rounded-lg border border-gray-200 shadow-sm p-4 flex items-start gap-2">
        <div className="flex-1">
          <input
            type="email"
            required
            placeholder={t('admin_add_operator_placeholder')}
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
        <button
          type="submit"
          disabled={adding}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          {t('admin_add_operator')}
        </button>
      </form>

      {loading ? (
        <div className="text-gray-500">{t('admin_loading')}</div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm divide-y divide-gray-100">
          {operators.map(op => {
            const isSelf = op.user_id === session.user.id
            return (
              <div key={op.user_id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{op.email || op.user_id}</span>
                  {isSelf && (
                    <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {t('admin_you_badge')}
                    </span>
                  )}
                  <span className="text-xs text-gray-400">{new Date(op.created_at).toLocaleDateString()}</span>
                </div>
                {!isSelf && (
                  <button
                    onClick={() => handleRemove(op.user_id)}
                    disabled={removingId === op.user_id}
                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {t('admin_remove_operator')}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
