/**
 * Provider List Component
 * Displays and manages service providers
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, X } from 'lucide-react'
import {
  getProviders,
  createProvider,
  updateProvider,
} from '@/lib/actions'
import { cn } from '@/lib/utils'

interface Provider {
  id: string
  name: string
  email: string
  specialties: string // JSON array
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface ProviderListProps {
  autoRefresh?: boolean
  refreshInterval?: number
}

export function ProviderList({
  autoRefresh = false,
  refreshInterval = 5000,
}: ProviderListProps = {}) {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingProvider, setEditingProvider] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [specialtyFilter, setSpecialtyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    specialties: [''],
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchProviders = async () => {
    const filters: any = {}
    if (specialtyFilter) filters.specialty = specialtyFilter
    if (statusFilter !== 'all') filters.isActive = statusFilter === 'active'

    const result = await getProviders(filters)
    if (result.success) {
      setProviders(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to load providers')
    }
    setLoading(false)
  }

  // Initial load
  useEffect(() => {
    fetchProviders()
  }, [specialtyFilter, statusFilter])

  // Search with debounce
  useEffect(() => {
    if (!searchTerm) return

    const timer = setTimeout(() => {
      fetchProviders()
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchProviders, refreshInterval)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateProvider = async () => {
    if (!validateForm()) return

    const result = await createProvider({
      name: formData.name,
      email: formData.email,
      specialties: formData.specialties.filter(s => s.trim()),
    })

    if (result.success) {
      setShowCreateForm(false)
      setFormData({ name: '', email: '', specialties: [''] })
      setFormErrors({})
      fetchProviders()
    }
  }

  const handleToggleActive = async (providerId: string, currentStatus: boolean) => {
    await updateProvider(providerId, { isActive: !currentStatus })
    fetchProviders()
  }

  const handleEditProvider = async (providerId: string) => {
    if (!validateForm()) return

    await updateProvider(providerId, {
      name: formData.name,
      email: formData.email,
      specialties: formData.specialties.filter(s => s.trim()),
    })

    setEditingProvider(null)
    setFormData({ name: '', email: '', specialties: [''] })
    setFormErrors({})
    fetchProviders()
  }

  const startEdit = (provider: Provider) => {
    setEditingProvider(provider.id)
    setFormData({
      name: provider.name,
      email: provider.email,
      specialties: JSON.parse(provider.specialties),
    })
  }

  const addSpecialtyField = () => {
    setFormData({
      ...formData,
      specialties: [...formData.specialties, ''],
    })
  }

  const updateSpecialty = (index: number, value: string) => {
    const newSpecialties = [...formData.specialties]
    newSpecialties[index] = value
    setFormData({ ...formData, specialties: newSpecialties })
  }

  const removeSpecialty = (index: number) => {
    const newSpecialties = formData.specialties.filter((_, i) => i !== index)
    setFormData({ ...formData, specialties: newSpecialties })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading providers...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    )
  }

  const filteredProviders = providers.filter(provider => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return provider.name.toLowerCase().includes(searchLower) ||
             provider.email.toLowerCase().includes(searchLower)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Providers</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Provider
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="search" className="sr-only">Search providers</label>
          <input
            id="search"
            type="text"
            placeholder="Search providers..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        <div>
          <label htmlFor="specialty-filter" className="sr-only">Filter by specialty</label>
          <select
            id="specialty-filter"
            aria-label="Filter by specialty"
            value={specialtyFilter}
            onChange={e => setSpecialtyFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">All Specialties</option>
            <option value="cardiology">Cardiology</option>
            <option value="internal medicine">Internal Medicine</option>
            <option value="hair cutting">Hair Cutting</option>
            <option value="coloring">Coloring</option>
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="sr-only">Filter by status</label>
          <select
            id="status-filter"
            aria-label="Filter by status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Create/Edit Form */}
      {(showCreateForm || editingProvider) && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingProvider ? 'Edit Provider' : 'Create New Provider'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingProvider(null)
                setFormData({ name: '', email: '', specialties: [''] })
                setFormErrors({})
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg',
                  formErrors.name && 'border-red-500'
                )}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                onBlur={() => {
                  if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
                    setFormErrors({ ...formErrors, email: 'Invalid email format' })
                  } else {
                    const { email, ...rest } = formErrors
                    setFormErrors(rest)
                  }
                }}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg',
                  formErrors.email && 'border-red-500'
                )}
              />
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialties
              </label>
              {formData.specialties.map((specialty, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    aria-label={index === 0 ? 'Specialties' : `Specialty ${index + 1}`}
                    value={specialty}
                    onChange={e => updateSpecialty(index, e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-lg"
                    placeholder="e.g., Cardiology"
                  />
                  {formData.specialties.length > 1 && (
                    <button
                      onClick={() => removeSpecialty(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={addSpecialtyField}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                + Add Specialty
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => editingProvider ? handleEditProvider(editingProvider) : handleCreateProvider()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
              >
                {editingProvider ? 'Save Changes' : 'Create Provider'}
              </button>
              <button
                onClick={() => {
                  setShowCreateForm(false)
                  setEditingProvider(null)
                  setFormData({ name: '', email: '', specialties: [''] })
                  setFormErrors({})
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Provider List */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No providers found
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredProviders.map(provider => (
            <div
              key={provider.id}
              className="bg-white rounded-lg border p-6 flex items-start justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {provider.name}
                  </h3>
                  <span
                    className={cn(
                      'px-2 py-1 text-xs font-medium rounded',
                      provider.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {provider.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                <p className="text-gray-600 mb-2">{provider.email}</p>

                <div className="flex flex-wrap gap-2">
                  {JSON.parse(provider.specialties).map((specialty: string, index: number) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-sm rounded"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => startEdit(provider)}
                  aria-label="Edit"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(provider.id, provider.isActive)}
                  aria-label={provider.isActive ? 'Deactivate' : 'Activate'}
                  className={cn(
                    'px-3 py-1 text-sm font-medium rounded',
                    provider.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  )}
                >
                  {provider.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
