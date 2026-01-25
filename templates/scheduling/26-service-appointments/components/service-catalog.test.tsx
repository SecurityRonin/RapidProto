/**
 * Service Catalog Component Tests
 * Tests for displaying and managing services
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ServiceCatalog } from './service-catalog'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  getServices: vi.fn(),
  createService: vi.fn(),
  updateService: vi.fn(),
}))

import { getServices, createService, updateService } from '@/lib/actions'

describe('ServiceCatalog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Service Display', () => {
    it('should display list of services', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'service_2',
            name: 'Hair Color',
            description: 'Full color treatment',
            category: 'Hair',
            duration: 120,
            price: 150,
            depositRequired: true,
            depositAmount: 50,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument()
        expect(screen.getByText('Hair Color')).toBeInTheDocument()
      })
    })

    it('should display service pricing', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('$50')).toBeInTheDocument()
      })
    })

    it('should display service duration', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('30 min')).toBeInTheDocument()
      })
    })

    it('should show deposit badge when required', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Hair Color',
            description: 'Full color',
            category: 'Hair',
            duration: 120,
            price: 150,
            depositRequired: true,
            depositAmount: 50,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('$50 deposit')).toBeInTheDocument()
      })
    })

    it('should display loading state', () => {
      vi.mocked(getServices).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ServiceCatalog />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should display error message on failure', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: false,
        error: 'Failed to load services',
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })

    it('should display empty state when no services', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText(/no services found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Category Filtering', () => {
    it('should filter services by category', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      const categoryFilter = screen.getByLabelText(/filter by category/i)
      fireEvent.change(categoryFilter, { target: { value: 'Hair' } })

      await waitFor(() => {
        expect(getServices).toHaveBeenCalledWith({ category: 'Hair' })
      })
    })

    it('should show all categories option', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const categoryFilter = screen.getByLabelText(/filter by category/i)
      expect(screen.getByRole('option', { name: /all categories/i })).toBeInTheDocument()
    })

    it('should filter by active status', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'active' } })

      await waitFor(() => {
        expect(getServices).toHaveBeenCalledWith({ isActive: true })
      })
    })
  })

  describe('Service Creation', () => {
    it('should show create service form', () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      expect(screen.getByText(/create new service/i)).toBeInTheDocument()
    })

    it('should create new service', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(createService).mockResolvedValue({
        success: true,
        data: {
          id: 'service_new',
          name: 'New Service',
          description: 'Description',
          category: 'Category',
          duration: 60,
          price: 100,
          depositRequired: false,
          depositAmount: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const nameInput = screen.getByLabelText(/service name/i)
      const categoryInput = screen.getByLabelText(/category/i)
      const durationInput = screen.getByLabelText(/duration/i)
      const priceInput = screen.getByLabelText(/price/i)

      fireEvent.change(nameInput, { target: { value: 'New Service' } })
      fireEvent.change(categoryInput, { target: { value: 'Category' } })
      fireEvent.change(durationInput, { target: { value: '60' } })
      fireEvent.change(priceInput, { target: { value: '100' } })

      const submitButton = screen.getByText(/create service/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(createService).toHaveBeenCalledWith({
          name: 'New Service',
          category: 'Category',
          duration: 60,
          price: 100,
          depositRequired: false,
        })
      })
    })

    it('should validate required fields', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const submitButton = screen.getByText(/create service/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should validate duration is positive', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const durationInput = screen.getByLabelText(/duration/i)
      fireEvent.change(durationInput, { target: { value: '-10' } })
      fireEvent.blur(durationInput)

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument()
      })
    })

    it('should validate price is non-negative', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const priceInput = screen.getByLabelText(/price/i)
      fireEvent.change(priceInput, { target: { value: '-50' } })
      fireEvent.blur(priceInput)

      await waitFor(() => {
        expect(screen.getByText(/cannot be negative/i)).toBeInTheDocument()
      })
    })

    it('should handle deposit requirements', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(createService).mockResolvedValue({
        success: true,
        data: {
          id: 'service_new',
          name: 'Service',
          description: null,
          category: 'Category',
          duration: 60,
          price: 100,
          depositRequired: true,
          depositAmount: 25,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const depositCheckbox = screen.getByLabelText(/require deposit/i)
      fireEvent.click(depositCheckbox)

      // Deposit amount field should appear
      const depositAmountInput = screen.getByLabelText(/deposit amount/i)
      expect(depositAmountInput).toBeInTheDocument()

      fireEvent.change(depositAmountInput, { target: { value: '25' } })

      const nameInput = screen.getByLabelText(/service name/i)
      const categoryInput = screen.getByLabelText(/category/i)
      const durationInput = screen.getByLabelText(/duration/i)
      const priceInput = screen.getByLabelText(/price/i)

      fireEvent.change(nameInput, { target: { value: 'Service' } })
      fireEvent.change(categoryInput, { target: { value: 'Category' } })
      fireEvent.change(durationInput, { target: { value: '60' } })
      fireEvent.change(priceInput, { target: { value: '100' } })

      const submitButton = screen.getByText(/create service/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(createService).toHaveBeenCalledWith({
          name: 'Service',
          category: 'Category',
          duration: 60,
          price: 100,
          depositRequired: true,
          depositAmount: 25,
        })
      })
    })

    it('should validate deposit amount when deposit required', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ServiceCatalog />)

      const createButton = screen.getByText(/add service/i)
      fireEvent.click(createButton)

      const depositCheckbox = screen.getByLabelText(/require deposit/i)
      fireEvent.click(depositCheckbox)

      const priceInput = screen.getByLabelText(/price/i)
      fireEvent.change(priceInput, { target: { value: '100' } })

      const depositAmountInput = screen.getByLabelText(/deposit amount/i)
      fireEvent.change(depositAmountInput, { target: { value: '150' } })
      fireEvent.blur(depositAmountInput)

      await waitFor(() => {
        expect(screen.getByText(/cannot exceed price/i)).toBeInTheDocument()
      })
    })
  })

  describe('Service Editing', () => {
    it('should toggle service active status', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
      vi.mocked(updateService).mockResolvedValue({
        success: true,
        data: {
          id: 'service_1',
          name: 'Haircut',
          description: 'Standard haircut',
          category: 'Hair',
          duration: 30,
          price: 50,
          depositRequired: false,
          depositAmount: null,
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument()
      })

      const toggleButton = screen.getByRole('button', { name: /deactivate/i })
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(updateService).toHaveBeenCalledWith('service_1', {
          isActive: false,
        })
      })
    })

    it('should edit service details', async () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
      vi.mocked(updateService).mockResolvedValue({
        success: true,
        data: {
          id: 'service_1',
          name: 'Premium Haircut',
          description: 'Premium haircut service',
          category: 'Hair',
          duration: 45,
          price: 75,
          depositRequired: false,
          depositAmount: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ServiceCatalog />)

      await waitFor(() => {
        expect(screen.getByText('Haircut')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const nameInput = screen.getByLabelText(/service name/i)
      const priceInput = screen.getByLabelText(/price/i)
      const durationInput = screen.getByLabelText(/duration/i)

      fireEvent.change(nameInput, { target: { value: 'Premium Haircut' } })
      fireEvent.change(priceInput, { target: { value: '75' } })
      fireEvent.change(durationInput, { target: { value: '45' } })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateService).toHaveBeenCalledWith('service_1', {
          name: 'Premium Haircut',
          price: 75,
          duration: 45,
        })
      })
    })
  })

  describe('Grid vs List View', () => {
    it('should toggle between grid and list view', () => {
      vi.mocked(getServices).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'service_1',
            name: 'Haircut',
            description: 'Standard haircut',
            category: 'Hair',
            duration: 30,
            price: 50,
            depositRequired: false,
            depositAmount: null,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ServiceCatalog />)

      const gridViewButton = screen.getByRole('button', { name: /grid view/i })
      const listViewButton = screen.getByRole('button', { name: /list view/i })

      expect(gridViewButton).toBeInTheDocument()
      expect(listViewButton).toBeInTheDocument()

      fireEvent.click(listViewButton)

      // Check that layout changes
      const serviceContainer = screen.getByTestId('service-container')
      expect(serviceContainer).toHaveClass('list-view')
    })
  })
})
