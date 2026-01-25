import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { IntakeForm } from '../intake-form'

/**
 * TDD: Public Client Intake Form Tests
 */

// Mock file upload
const mockUpload = vi.fn()
vi.mock('@vercel/blob', () => ({
  upload: mockUpload,
}))

// Mock server action
const mockSubmitIntake = vi.fn()
vi.mock('@/lib/actions/intake', () => ({
  submitIntakeForm: mockSubmitIntake,
}))

describe('IntakeForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render all form fields', () => {
    render(<IntakeForm formId="form_123" />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/company/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/describe your needs/i)).toBeInTheDocument()
    expect(screen.getByText(/upload documents/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    render(<IntakeForm formId="form_123" />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    })

    expect(mockSubmitIntake).not.toHaveBeenCalled()
  })

  it('should validate email format', async () => {
    render(<IntakeForm formId="form_123" />)

    const emailInput = screen.getByLabelText(/email/i)
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } })
    fireEvent.blur(emailInput)

    await waitFor(() => {
      expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
    })
  })

  it('should handle document upload', async () => {
    mockUpload.mockResolvedValueOnce({
      url: 'https://blob.vercel-storage.com/doc-123.pdf',
    })

    render(<IntakeForm formId="form_123" />)

    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/upload documents/i)

    fireEvent.change(fileInput, { target: { files: [file] } })

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith('document.pdf', file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
    })

    expect(screen.getByText(/document.pdf/i)).toBeInTheDocument()
  })

  it('should submit form with all data', async () => {
    mockSubmitIntake.mockResolvedValueOnce({
      success: true,
      data: { id: 'sub_123' },
    })

    render(<IntakeForm formId="form_123" />)

    // Fill form
    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: '555-0100' },
    })
    fireEvent.change(screen.getByLabelText(/company/i), {
      target: { value: 'ACME Corp' },
    })
    fireEvent.change(screen.getByLabelText(/describe your needs/i), {
      target: { value: 'Need help with contract review' },
    })

    // Submit
    const submitButton = screen.getByRole('button', { name: /submit/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockSubmitIntake).toHaveBeenCalledWith({
        formId: 'form_123',
        submitterName: 'John Doe',
        submitterEmail: 'john@example.com',
        data: {
          fullName: 'John Doe',
          phone: '555-0100',
          company: 'ACME Corp',
          message: 'Need help with contract review',
          documents: [],
        },
      })
    })

    expect(screen.getByText(/thank you/i)).toBeInTheDocument()
  })

  it('should handle submission errors', async () => {
    mockSubmitIntake.mockResolvedValueOnce({
      success: false,
      error: 'Failed to submit',
    })

    render(<IntakeForm formId="form_123" />)

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: 'John Doe' },
    })
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'john@example.com' },
    })

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(screen.getByText(/failed to submit/i)).toBeInTheDocument()
    })
  })

  it('should disable submit during upload', async () => {
    mockUpload.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve({ url: 'test.pdf' }), 1000)
        })
    )

    render(<IntakeForm formId="form_123" />)

    const file = new File(['test'], 'large.pdf', { type: 'application/pdf' })
    const fileInput = screen.getByLabelText(/upload documents/i)
    fireEvent.change(fileInput, { target: { files: [file] } })

    const submitButton = screen.getByRole('button', { name: /submit/i })
    expect(submitButton).toBeDisabled()
  })

  it('should support multiple document uploads', async () => {
    mockUpload
      .mockResolvedValueOnce({ url: 'doc1.pdf' })
      .mockResolvedValueOnce({ url: 'doc2.pdf' })

    render(<IntakeForm formId="form_123" />)

    const fileInput = screen.getByLabelText(/upload documents/i)

    const file1 = new File(['test1'], 'doc1.pdf', { type: 'application/pdf' })
    const file2 = new File(['test2'], 'doc2.pdf', { type: 'application/pdf' })

    fireEvent.change(fileInput, { target: { files: [file1] } })

    await waitFor(() => {
      expect(screen.getByText(/doc1.pdf/i)).toBeInTheDocument()
    })

    fireEvent.change(fileInput, { target: { files: [file2] } })

    await waitFor(() => {
      expect(screen.getByText(/doc2.pdf/i)).toBeInTheDocument()
    })

    expect(mockUpload).toHaveBeenCalledTimes(2)
  })

  it('should pre-fill from URL params', () => {
    // Simulate URL: /intake?name=Jane&email=jane@example.com
    const searchParams = new URLSearchParams({
      name: 'Jane Smith',
      email: 'jane@example.com',
    })

    render(<IntakeForm formId="form_123" searchParams={searchParams} />)

    expect(screen.getByLabelText(/full name/i)).toHaveValue('Jane Smith')
    expect(screen.getByLabelText(/email/i)).toHaveValue('jane@example.com')
  })
})
