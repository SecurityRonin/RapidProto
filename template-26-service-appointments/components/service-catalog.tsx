/**
 * Service Catalog Component
 * Displays and manages services
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, X, Grid, List } from 'lucide-react'
import {
  getServices,
  createService,
  updateService,
} from '@/lib/actions'
import { cn } from '@/lib/utils'

interface Service {
  id: string
  name: string
  description: string | null
  category: string
  duration: number
  price: number
  depositRequired: boolean
  depositAmount: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export function ServiceCatalog() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingService, setEditingService] = useState<string | null>(null)
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    duration: '',
    price: '',
    depositRequired: false,
    depositAmount: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const fetchServices = async () => {
    const filters: any = {}
    if (categoryFilter) filters.category = categoryFilter
    if (statusFilter !== 'all') filters.isActive = statusFilter === 'active'

    const result = await getServices(filters)
    if (result.success) {
      setServices(result.data)
      setError(null)
    } else {
      setError(result.error || 'Failed to load services')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchServices()
  }, [categoryFilter, statusFilter])

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }

    if (!formData.category.trim()) {
      errors.category = 'Category is required'
    }

    const duration = parseInt(formData.duration)
    if (!formData.duration || isNaN(duration) || duration <= 0) {
      errors.duration = 'Duration must be positive'
    }

    const price = parseFloat(formData.price)
    if (!formData.price || isNaN(price) || price < 0) {
      errors.price = 'Price cannot be negative'
    }

    if (formData.depositRequired) {
      const depositAmount = parseFloat(formData.depositAmount)
      if (!formData.depositAmount || isNaN(depositAmount) || depositAmount <= 0) {
        errors.depositAmount = 'Deposit amount is required'
      } else if (depositAmount > price) {
        errors.depositAmount = 'Deposit cannot exceed price'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateService = async () => {
    if (!validateForm()) return

    const result = await createService({
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      depositRequired: formData.depositRequired,
      depositAmount: formData.depositRequired ? parseFloat(formData.depositAmount) : undefined,
    })

    if (result.success) {
      setShowCreateForm(false)
      resetForm()
      fetchServices()
    }
  }

  const handleEditService = async (serviceId: string) => {
    if (!validateForm()) return

    await updateService(serviceId, {
      name: formData.name,
      description: formData.description || undefined,
      category: formData.category,
      duration: parseInt(formData.duration),
      price: parseFloat(formData.price),
      depositRequired: formData.depositRequired,
      depositAmount: formData.depositRequired ? parseFloat(formData.depositAmount) : undefined,
    })

    setEditingService(null)
    resetForm()
    fetchServices()
  }

  const handleToggleActive = async (serviceId: string, currentStatus: boolean) => {
    await updateService(serviceId, { isActive: !currentStatus })
    fetchServices()
  }

  const startEdit = (service: Service) => {
    setEditingService(service.id)
    setFormData({
      name: service.name,
      description: service.description || '',
      category: service.category,
      duration: service.duration.toString(),
      price: service.price.toString(),
      depositRequired: service.depositRequired,
      depositAmount: service.depositAmount?.toString() || '',
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      duration: '',
      price: '',
      depositRequired: false,
      depositAmount: '',
    })
    setFormErrors({})
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-gray-600">Loading services...</div>
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Services</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('grid')}
            aria-label="Grid view"
            className={cn(
              'p-2 rounded',
              viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            aria-label="List view"
            className={cn(
              'p-2 rounded',
              viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'
            )}
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium ml-4"
          >
            <Plus className="w-4 h-4" />
            Add Service
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="category-filter" className="sr-only">Filter by category</label>
          <select
            id="category-filter"
            aria-label="Filter by category"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="">All Categories</option>
            <option value="Hair">Hair</option>
            <option value="Nails">Nails</option>
            <option value="Medical">Medical</option>
            <option value="Dental">Dental</option>
            <option value="Auto">Auto</option>
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
      {(showCreateForm || editingService) && (
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {editingService ? 'Edit Service' : 'Create New Service'}
            </h3>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingService(null)
                resetForm()
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="service-name" className="block text-sm font-medium text-gray-700 mb-1">
                Service Name *
              </label>
              <input
                id="service-name"
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
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <input
                id="category"
                type="text"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg',
                  formErrors.category && 'border-red-500'
                )}
              />
              {formErrors.category && (
                <p className="mt-1 text-sm text-red-600">{formErrors.category}</p>
              )}
            </div>

            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-1">
                Duration (minutes) *
              </label>
              <input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={e => setFormData({ ...formData, duration: e.target.value })}
                onBlur={() => {
                  const duration = parseInt(formData.duration)
                  if (formData.duration && (isNaN(duration) || duration <= 0)) {
                    setFormErrors({ ...formErrors, duration: 'Duration must be positive' })
                  } else {
                    const { duration, ...rest } = formErrors
                    setFormErrors(rest)
                  }
                }}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg',
                  formErrors.duration && 'border-red-500'
                )}
              />
              {formErrors.duration && (
                <p className="mt-1 text-sm text-red-600">{formErrors.duration}</p>
              )}
            </div>

            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                Price ($) *
              </label>
              <input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                onBlur={() => {
                  const price = parseFloat(formData.price)
                  if (formData.price && (isNaN(price) || price < 0)) {
                    setFormErrors({ ...formErrors, price: 'Price cannot be negative' })
                  } else {
                    const { price, ...rest } = formErrors
                    setFormErrors(rest)
                  }
                }}
                className={cn(
                  'w-full px-4 py-2 border rounded-lg',
                  formErrors.price && 'border-red-500'
                )}
              />
              {formErrors.price && (
                <p className="mt-1 text-sm text-red-600">{formErrors.price}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border rounded-lg"
              />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-2">
                <input
                  id="deposit-required"
                  type="checkbox"
                  checked={formData.depositRequired}
                  onChange={e => setFormData({ ...formData, depositRequired: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="deposit-required" className="text-sm font-medium text-gray-700">
                  Require Deposit
                </label>
              </div>

              {formData.depositRequired && (
                <div>
                  <label htmlFor="deposit-amount" className="block text-sm font-medium text-gray-700 mb-1">
                    Deposit Amount ($) *
                  </label>
                  <input
                    id="deposit-amount"
                    type="number"
                    step="0.01"
                    value={formData.depositAmount}
                    onChange={e => setFormData({ ...formData, depositAmount: e.target.value })}
                    onBlur={() => {
                      const price = parseFloat(formData.price)
                      const depositAmount = parseFloat(formData.depositAmount)
                      if (formData.depositAmount && !isNaN(depositAmount) && !isNaN(price) && depositAmount > price) {
                        setFormErrors({ ...formErrors, depositAmount: 'Deposit cannot exceed price' })
                      } else {
                        const { depositAmount, ...rest } = formErrors
                        setFormErrors(rest)
                      }
                    }}
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg',
                      formErrors.depositAmount && 'border-red-500'
                    )}
                  />
                  {formErrors.depositAmount && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.depositAmount}</p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 mt-6">
            <button
              onClick={() => editingService ? handleEditService(editingService) : handleCreateService()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              {editingService ? 'Save Changes' : 'Create Service'}
            </button>
            <button
              onClick={() => {
                setShowCreateForm(false)
                setEditingService(null)
                resetForm()
              }}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Service List */}
      {services.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No services found
        </div>
      ) : (
        <div
          data-testid="service-container"
          className={cn(
            viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'grid gap-4',
            viewMode === 'list' && 'list-view'
          )}
        >
          {services.map(service => (
            <div
              key={service.id}
              className="bg-white rounded-lg border p-6"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {service.name}
                  </h3>
                  <p className="text-sm text-gray-500">{service.category}</p>
                </div>
                <span
                  className={cn(
                    'px-2 py-1 text-xs font-medium rounded',
                    service.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              {service.description && (
                <p className="text-gray-600 text-sm mb-3">{service.description}</p>
              )}

              <div className="flex items-center gap-4 mb-3">
                <div>
                  <span className="text-2xl font-bold text-gray-900">${service.price}</span>
                </div>
                <div className="text-sm text-gray-600">
                  {service.duration} min
                </div>
              </div>

              {service.depositRequired && (
                <div className="mb-3">
                  <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-medium rounded">
                    ${service.depositAmount} deposit
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3 border-t">
                <button
                  onClick={() => startEdit(service)}
                  aria-label="Edit"
                  className="flex-1 px-3 py-1 text-sm border rounded hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleToggleActive(service.id, service.isActive)}
                  aria-label={service.isActive ? 'Deactivate' : 'Activate'}
                  className={cn(
                    'flex-1 px-3 py-1 text-sm font-medium rounded',
                    service.isActive
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
                  )}
                >
                  {service.isActive ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
