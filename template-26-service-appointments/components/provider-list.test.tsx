/**
 * Provider List Component Tests
 * Tests for displaying and managing service providers
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProviderList } from './provider-list'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  getProviders: vi.fn(),
  createProvider: vi.fn(),
  updateProvider: vi.fn(),
}))

import { getProviders, createProvider, updateProvider } from '@/lib/actions'

describe('ProviderList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Provider Display', () => {
    it('should display list of providers', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Sarah Smith',
            email: 'sarah@example.com',
            specialties: JSON.stringify(['cardiology', 'internal medicine']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'provider_2',
            name: 'Mike Johnson',
            email: 'mike@example.com',
            specialties: JSON.stringify(['hair cutting', 'coloring']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Sarah Smith')).toBeInTheDocument()
        expect(screen.getByText('Mike Johnson')).toBeInTheDocument()
      })
    })

    it('should display provider specialties', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology', 'internal medicine']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('cardiology')).toBeInTheDocument()
        expect(screen.getByText('internal medicine')).toBeInTheDocument()
      })
    })

    it('should show active status badge', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('Active')).toBeInTheDocument()
      })
    })

    it('should show inactive status badge', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology']),
            isActive: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('Inactive')).toBeInTheDocument()
      })
    })

    it('should display loading state initially', () => {
      vi.mocked(getProviders).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ProviderList />)

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })

    it('should display error message on failure', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: false,
        error: 'Failed to load providers',
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText(/failed to load/i)).toBeInTheDocument()
      })
    })

    it('should display empty state when no providers', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText(/no providers found/i)).toBeInTheDocument()
      })
    })
  })

  describe('Filter Functionality', () => {
    it('should filter by specialty', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })

      render(<ProviderList />)

      const specialtyFilter = screen.getByLabelText(/filter by specialty/i)
      fireEvent.change(specialtyFilter, { target: { value: 'cardiology' } })

      await waitFor(() => {
        expect(getProviders).toHaveBeenCalledWith({ specialty: 'cardiology' })
      })
    })

    it('should filter by active status', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      const statusFilter = screen.getByLabelText(/filter by status/i)
      fireEvent.change(statusFilter, { target: { value: 'active' } })

      await waitFor(() => {
        expect(getProviders).toHaveBeenCalledWith({ isActive: true })
      })
    })

    it('should search by name', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      const searchInput = screen.getByPlaceholderText(/search providers/i)
      fireEvent.change(searchInput, { target: { value: 'smith' } })

      // Should debounce search
      await waitFor(
        () => {
          expect(getProviders).toHaveBeenCalled()
        },
        { timeout: 1000 }
      )
    })
  })

  describe('Provider Creation', () => {
    it('should show create provider form', () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      expect(screen.getByText(/create new provider/i)).toBeInTheDocument()
    })

    it('should create new provider', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(createProvider).mockResolvedValue({
        success: true,
        data: {
          id: 'provider_new',
          name: 'New Provider',
          email: 'new@example.com',
          specialties: JSON.stringify(['specialty']),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const specialtyInput = screen.getByLabelText(/specialties/i)

      fireEvent.change(nameInput, { target: { value: 'New Provider' } })
      fireEvent.change(emailInput, { target: { value: 'new@example.com' } })
      fireEvent.change(specialtyInput, { target: { value: 'specialty' } })

      const submitButton = screen.getByText(/create provider/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(createProvider).toHaveBeenCalledWith({
          name: 'New Provider',
          email: 'new@example.com',
          specialties: ['specialty'],
        })
      })
    })

    it('should validate email format', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      const emailInput = screen.getByLabelText(/email/i)
      fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
      fireEvent.blur(emailInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })

    it('should require name field', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      const submitButton = screen.getByText(/create provider/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should support multiple specialties', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(createProvider).mockResolvedValue({
        success: true,
        data: {
          id: 'provider_new',
          name: 'Provider',
          email: 'provider@example.com',
          specialties: JSON.stringify(['specialty1', 'specialty2']),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      const addSpecialtyButton = screen.getByText(/add specialty/i)
      fireEvent.click(addSpecialtyButton)

      const specialtyInputs = screen.getAllByLabelText(/specialty/i)
      expect(specialtyInputs).toHaveLength(2)
    })

    it('should close form after successful creation', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })
      vi.mocked(createProvider).mockResolvedValue({
        success: true,
        data: {
          id: 'provider_new',
          name: 'Provider',
          email: 'provider@example.com',
          specialties: JSON.stringify(['specialty']),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ProviderList />)

      const createButton = screen.getByText(/add provider/i)
      fireEvent.click(createButton)

      const nameInput = screen.getByLabelText(/name/i)
      const emailInput = screen.getByLabelText(/email/i)
      const specialtyInput = screen.getByLabelText(/specialties/i)

      fireEvent.change(nameInput, { target: { value: 'Provider' } })
      fireEvent.change(emailInput, { target: { value: 'provider@example.com' } })
      fireEvent.change(specialtyInput, { target: { value: 'specialty' } })

      const submitButton = screen.getByText(/create provider/i)
      fireEvent.click(submitButton)

      await waitFor(() => {
        expect(screen.queryByText(/create new provider/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Provider Editing', () => {
    it('should toggle provider active status', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
      vi.mocked(updateProvider).mockResolvedValue({
        success: true,
        data: {
          id: 'provider_1',
          name: 'Dr. Smith',
          email: 'smith@example.com',
          specialties: JSON.stringify(['cardiology']),
          isActive: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      })

      const toggleButton = screen.getByRole('button', { name: /deactivate/i })
      fireEvent.click(toggleButton)

      await waitFor(() => {
        expect(updateProvider).toHaveBeenCalledWith('provider_1', {
          isActive: false,
        })
      })
    })

    it('should edit provider details', async () => {
      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [
          {
            id: 'provider_1',
            name: 'Dr. Smith',
            email: 'smith@example.com',
            specialties: JSON.stringify(['cardiology']),
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
      })
      vi.mocked(updateProvider).mockResolvedValue({
        success: true,
        data: {
          id: 'provider_1',
          name: 'Dr. Sarah Smith',
          email: 'sarah.smith@example.com',
          specialties: JSON.stringify(['cardiology', 'internal medicine']),
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      })

      render(<ProviderList />)

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument()
      })

      const editButton = screen.getByRole('button', { name: /edit/i })
      fireEvent.click(editButton)

      const nameInput = screen.getByLabelText(/name/i)
      fireEvent.change(nameInput, { target: { value: 'Dr. Sarah Smith' } })

      const saveButton = screen.getByRole('button', { name: /save/i })
      fireEvent.click(saveButton)

      await waitFor(() => {
        expect(updateProvider).toHaveBeenCalledWith('provider_1', {
          name: 'Dr. Sarah Smith',
        })
      })
    })
  })

  describe('Auto-refresh', () => {
    it('should refresh provider list periodically', async () => {
      vi.useFakeTimers()

      vi.mocked(getProviders).mockResolvedValue({
        success: true,
        data: [],
      })

      render(<ProviderList autoRefresh={true} refreshInterval={5000} />)

      expect(getProviders).toHaveBeenCalledTimes(1)

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(getProviders).toHaveBeenCalledTimes(2)
      })

      vi.advanceTimersByTime(5000)

      await waitFor(() => {
        expect(getProviders).toHaveBeenCalledTimes(3)
      })

      vi.useRealTimers()
    })
  })
})
