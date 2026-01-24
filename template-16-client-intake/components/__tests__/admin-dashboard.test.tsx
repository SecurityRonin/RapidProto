import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminDashboard } from '../admin-dashboard'

/**
 * TDD: Admin Dashboard Tests
 */

// Mock server actions
const mockGetClients = vi.fn()
const mockGetSubmissions = vi.fn()
const mockApproveSubmission = vi.fn()
const mockRunConflictCheck = vi.fn()

vi.mock('@/lib/actions/clients', () => ({
  getClients: mockGetClients,
  approveSubmission: mockApproveSubmission,
  runConflictCheck: mockRunConflictCheck,
}))

vi.mock('@/lib/actions/admin', () => ({
  getPendingSubmissions: mockGetSubmissions,
}))

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock data
    mockGetClients.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'client_1',
          name: 'ACME Corp',
          type: 'business',
          email: 'contact@acme.com',
          status: 'active',
          createdAt: new Date(),
        },
      ],
    })

    mockGetSubmissions.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'sub_1',
          submitterName: 'John Doe',
          submitterEmail: 'john@example.com',
          status: 'pending',
          submittedAt: new Date(),
          data: JSON.stringify({
            fullName: 'John Doe',
            company: 'XYZ Inc',
            message: 'Need legal help',
          }),
        },
      ],
    })
  })

  it('should render dashboard tabs', () => {
    render(<AdminDashboard />)

    expect(screen.getByRole('tab', { name: /pending submissions/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /clients/i })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument()
  })

  it('should display pending submissions', async () => {
    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('john@example.com')).toBeInTheDocument()
      expect(screen.getByText(/XYZ Inc/i)).toBeInTheDocument()
    })

    expect(mockGetSubmissions).toHaveBeenCalled()
  })

  it('should display clients list', async () => {
    render(<AdminDashboard />)

    const clientsTab = screen.getByRole('tab', { name: /clients/i })
    fireEvent.click(clientsTab)

    await waitFor(() => {
      expect(screen.getByText('ACME Corp')).toBeInTheDocument()
      expect(screen.getByText('contact@acme.com')).toBeInTheDocument()
      expect(screen.getByText(/active/i)).toBeInTheDocument()
    })

    expect(mockGetClients).toHaveBeenCalled()
  })

  it('should approve submission and create client', async () => {
    mockApproveSubmission.mockResolvedValueOnce({
      success: true,
      data: {
        clientId: 'new_client_1',
        client: { name: 'John Doe' },
        emailSent: true,
      },
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const approveButton = screen.getByRole('button', { name: /approve/i })
    fireEvent.click(approveButton)

    // Should show options modal
    await waitFor(() => {
      expect(screen.getByText(/create client/i)).toBeInTheDocument()
      expect(screen.getByText(/generate tasks/i)).toBeInTheDocument()
      expect(screen.getByText(/send welcome email/i)).toBeInTheDocument()
    })

    // Select options
    fireEvent.click(screen.getByLabelText(/create client/i))
    fireEvent.click(screen.getByLabelText(/generate tasks/i))
    fireEvent.click(screen.getByLabelText(/send welcome email/i))

    // Confirm approval
    const confirmButton = screen.getByRole('button', { name: /confirm approval/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockApproveSubmission).toHaveBeenCalledWith('sub_1', {
        approve: true,
        createClient: true,
        generateTasks: true,
        sendWelcomeEmail: true,
      })
    })

    expect(screen.getByText(/approved successfully/i)).toBeInTheDocument()
  })

  it('should reject submission with notes', async () => {
    mockApproveSubmission.mockResolvedValueOnce({
      success: true,
      data: { submission: { status: 'rejected' } },
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const rejectButton = screen.getByRole('button', { name: /reject/i })
    fireEvent.click(rejectButton)

    // Should show notes input
    await waitFor(() => {
      expect(screen.getByLabelText(/rejection notes/i)).toBeInTheDocument()
    })

    const notesInput = screen.getByLabelText(/rejection notes/i)
    fireEvent.change(notesInput, {
      target: { value: 'Missing required documents' },
    })

    const confirmButton = screen.getByRole('button', { name: /confirm rejection/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockApproveSubmission).toHaveBeenCalledWith('sub_1', {
        approve: false,
        reviewNotes: 'Missing required documents',
      })
    })
  })

  it('should run conflict check from submission', async () => {
    mockRunConflictCheck.mockResolvedValueOnce({
      success: true,
      data: {
        status: 'clear',
        opposingParties: [],
      },
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    const conflictButton = screen.getByRole('button', { name: /check conflicts/i })
    fireEvent.click(conflictButton)

    await waitFor(() => {
      expect(screen.getByLabelText(/opposing parties/i)).toBeInTheDocument()
    })

    const partiesInput = screen.getByLabelText(/opposing parties/i)
    fireEvent.change(partiesInput, {
      target: { value: 'Defendant Corp, John Smith' },
    })

    const runButton = screen.getByRole('button', { name: /run check/i })
    fireEvent.click(runButton)

    await waitFor(() => {
      expect(screen.getByText(/no conflicts found/i)).toBeInTheDocument()
    })
  })

  it('should filter clients by status', async () => {
    render(<AdminDashboard />)

    const clientsTab = screen.getByRole('tab', { name: /clients/i })
    fireEvent.click(clientsTab)

    await waitFor(() => {
      expect(screen.getByText('ACME Corp')).toBeInTheDocument()
    })

    const statusFilter = screen.getByLabelText(/filter by status/i)
    fireEvent.change(statusFilter, { target: { value: 'active' } })

    await waitFor(() => {
      expect(mockGetClients).toHaveBeenCalledWith({ status: 'active' })
    })
  })

  it('should search clients', async () => {
    render(<AdminDashboard />)

    const clientsTab = screen.getByRole('tab', { name: /clients/i })
    fireEvent.click(clientsTab)

    const searchInput = screen.getByPlaceholderText(/search clients/i)
    fireEvent.change(searchInput, { target: { value: 'ACME' } })

    await waitFor(() => {
      expect(mockGetClients).toHaveBeenCalledWith({ search: 'ACME' })
    })
  })

  it('should display analytics summary', async () => {
    mockGetSubmissions.mockResolvedValueOnce({
      success: true,
      data: [
        { id: '1', status: 'pending' },
        { id: '2', status: 'pending' },
        { id: '3', status: 'approved' },
      ],
    })

    mockGetClients.mockResolvedValueOnce({
      success: true,
      data: [
        { id: '1', status: 'prospect' },
        { id: '2', status: 'active' },
        { id: '3', status: 'active' },
      ],
    })

    render(<AdminDashboard />)

    const analyticsTab = screen.getByRole('tab', { name: /analytics/i })
    fireEvent.click(analyticsTab)

    await waitFor(() => {
      expect(screen.getByText(/pending submissions: 2/i)).toBeInTheDocument()
      expect(screen.getByText(/active clients: 2/i)).toBeInTheDocument()
      expect(screen.getByText(/prospects: 1/i)).toBeInTheDocument()
    })
  })

  it('should handle loading states', () => {
    mockGetSubmissions.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    render(<AdminDashboard />)

    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('should handle errors gracefully', async () => {
    mockGetSubmissions.mockResolvedValueOnce({
      success: false,
      error: 'Failed to fetch submissions',
    })

    render(<AdminDashboard />)

    await waitFor(() => {
      expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
    })
  })
})
