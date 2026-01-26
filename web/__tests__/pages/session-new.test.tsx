/**
 * TDD: New Session Page Tests
 * Clean design with shadcn/ui components
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import NewSessionPage from '@/app/session/new/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock createSession action
vi.mock('@/lib/actions', () => ({
  createSession: vi.fn(() => Promise.resolve({
    success: true,
    data: { id: 'test-session-id' }
  })),
}))

describe('New Session Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout', () => {
    it('renders centered content with max-width', () => {
      render(<NewSessionPage />)
      const container = document.querySelector('[class*="max-w"]')
      expect(container).toBeInTheDocument()
    })

    it('renders page title', () => {
      render(<NewSessionPage />)
      expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
    })

    it('renders back button to home', () => {
      render(<NewSessionPage />)
      const backLink = document.querySelector('a[href="/"]')
      expect(backLink).toBeInTheDocument()
    })
  })

  describe('Project Name Input', () => {
    it('renders project name input', () => {
      render(<NewSessionPage />)
      const input = screen.getByPlaceholderText(/todo|landing|dashboard/i)
      expect(input).toBeInTheDocument()
    })

    it('shows "What are you building?" heading', () => {
      render(<NewSessionPage />)
      expect(screen.getByText(/what are you building/i)).toBeInTheDocument()
    })

    it('allows typing project name', async () => {
      render(<NewSessionPage />)
      const input = screen.getByPlaceholderText(/todo|landing|dashboard/i)

      fireEvent.change(input, { target: { value: 'My Todo App' } })

      expect(input).toHaveValue('My Todo App')
    })
  })

  describe('Session Timeline', () => {
    it('shows the three phases with durations', () => {
      render(<NewSessionPage />)
      const allText = document.body.textContent || ''

      expect(allText).toMatch(/discovery/i)
      expect(allText).toMatch(/build/i)
      expect(allText).toMatch(/verify/i)
      expect(allText).toMatch(/10 min/) // Discovery and Verify phases
      expect(allText).toMatch(/30 min/) // Build phase
    })

    it('displays session timeline heading', () => {
      render(<NewSessionPage />)
      expect(screen.getByText(/session timeline/i)).toBeInTheDocument()
    })

    it('mentions 50 minutes total', () => {
      render(<NewSessionPage />)
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/50/)
    })
  })

  describe('Start Button', () => {
    it('renders start session button', () => {
      render(<NewSessionPage />)
      const button = screen.getByRole('button', { name: /start.*session/i })
      expect(button).toBeInTheDocument()
    })

    it('button is enabled by default (no role selection needed)', () => {
      render(<NewSessionPage />)
      const button = screen.getByRole('button', { name: /start.*session/i })
      expect(button).not.toBeDisabled()
    })

    it('creates session when clicked', async () => {
      const { createSession } = await import('@/lib/actions')
      const mockRouter = { push: vi.fn() }
      vi.mocked(useRouter).mockReturnValue(mockRouter as any)

      render(<NewSessionPage />)

      const button = screen.getByRole('button', { name: /start.*session/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(createSession).toHaveBeenCalledWith({
          role: 'builder',
          sessionTitle: 'Untitled Prototype',
        })
      })
    })

    it('creates session with custom title when provided', async () => {
      const { createSession } = await import('@/lib/actions')
      const mockRouter = { push: vi.fn() }
      vi.mocked(useRouter).mockReturnValue(mockRouter as any)

      render(<NewSessionPage />)

      const input = screen.getByPlaceholderText(/todo|landing|dashboard/i)
      fireEvent.change(input, { target: { value: 'My Cool App' } })

      const button = screen.getByRole('button', { name: /start.*session/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(createSession).toHaveBeenCalledWith({
          role: 'builder',
          sessionTitle: 'My Cool App',
        })
      })
    })

    it('redirects to session page after creation', async () => {
      const mockRouter = { push: vi.fn() }
      vi.mocked(useRouter).mockReturnValue(mockRouter as any)

      render(<NewSessionPage />)

      const button = screen.getByRole('button', { name: /start.*session/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/session/test-session-id')
      })
    })

    it('shows loading state when starting', async () => {
      render(<NewSessionPage />)

      const button = screen.getByRole('button', { name: /start.*session/i })
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText(/starting/i)).toBeInTheDocument()
      })
    })
  })

  describe('Warning Message', () => {
    it('shows warning that timer starts immediately', () => {
      render(<NewSessionPage />)
      expect(screen.getByText(/timer starts immediately/i)).toBeInTheDocument()
    })
  })
})
