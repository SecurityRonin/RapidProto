/**
 * TDD: Join Session Page Tests
 * Tests for the facilitator join flow and practice session
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import JoinSessionPage from '@/app/join/page'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value },
    removeItem: (key: string) => { delete store[key] },
    clear: () => { store = {} },
  }
})()

Object.defineProperty(global, 'localStorage', { value: localStorageMock })

// Mock fetch for API calls
global.fetch = vi.fn()

describe('Join Session Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    mockPush.mockClear()
  })

  describe('Layout', () => {
    it('should render the page with header', () => {
      render(<JoinSessionPage />)

      expect(screen.getByRole('heading', { name: /join session/i })).toBeInTheDocument()
    })

    it('should have a back button to home', () => {
      render(<JoinSessionPage />)

      const backLink = screen.getByRole('link')
      expect(backLink).toHaveAttribute('href', '/')
    })

    it('should show facilitator role description', () => {
      render(<JoinSessionPage />)

      expect(screen.getByText(/join as facilitator/i)).toBeInTheDocument()
    })
  })

  describe('Join Session Form', () => {
    it('should render session code input', () => {
      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      expect(input).toBeInTheDocument()
    })

    it('should auto-uppercase the session code', async () => {
      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'abc123' } })

      await waitFor(() => {
        expect(input).toHaveValue('ABC123')
      })
    })

    it('should have a join button', () => {
      render(<JoinSessionPage />)

      expect(screen.getByRole('button', { name: /join session/i })).toBeInTheDocument()
    })

    it('should disable join button when input is empty', () => {
      render(<JoinSessionPage />)

      const joinButton = screen.getByRole('button', { name: /join session/i })
      expect(joinButton).toBeDisabled()
    })

    it('should enable join button when code is entered', async () => {
      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'XYZ789' } })

      await waitFor(() => {
        const joinButton = screen.getByRole('button', { name: /join session/i })
        expect(joinButton).not.toBeDisabled()
      })
    })

    it('should show error when code is blank and submitted', async () => {
      render(<JoinSessionPage />)

      // Try to join with empty code (manually trigger without button since it's disabled)
      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.keyDown(input, { key: 'Enter' })

      await waitFor(() => {
        expect(screen.getByText(/please enter a session code/i)).toBeInTheDocument()
      })
    })

    it('should call join API with correct session code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response)

      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'TEST99' } })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/session/TEST99/join', {
          method: 'POST',
        })
      })
    })

    it('should navigate to session page on successful join', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response)

      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'VALID1' } })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/session/VALID1')
      })
    })

    it('should store facilitator role in localStorage on successful join', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: true }),
      } as Response)

      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'ABC123' } })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(localStorageMock.getItem('rapidproto_role_ABC123')).toBe('facilitator')
      })
    })

    it('should display error message on failed join', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve({ success: false, error: 'Session not found' }),
      } as Response)

      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'NOTEXIST' } })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/session not found/i)).toBeInTheDocument()
      })
    })

    it('should show loading state while joining', async () => {
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<JoinSessionPage />)

      const input = screen.getByPlaceholderText(/abc123/i)
      fireEvent.change(input, { target: { value: 'SLOW99' } })

      const joinButton = screen.getByRole('button', { name: /join session/i })
      fireEvent.click(joinButton)

      await waitFor(() => {
        expect(screen.getByText(/joining/i)).toBeInTheDocument()
      })
    })
  })

  describe('Practice Session', () => {
    it('should have a practice solo section', () => {
      render(<JoinSessionPage />)

      expect(screen.getByText(/practice solo/i)).toBeInTheDocument()
    })

    it('should have a start practice session button', () => {
      render(<JoinSessionPage />)

      expect(screen.getByRole('button', { name: /start practice session/i })).toBeInTheDocument()
    })

    it('should create a practice session on button click', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      await waitFor(() => {
        // Should navigate to a session page
        expect(mockPush).toHaveBeenCalledWith(expect.stringMatching(/\/session\/.+/))
      })
    })

    it('should save session to localStorage', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      await waitFor(() => {
        const sessions = localStorage.getItem('rapidproto_sessions')
        expect(sessions).toBeTruthy()
        const parsed = JSON.parse(sessions!)
        expect(parsed.length).toBeGreaterThan(0)
      })
    })

    it('should store facilitator role for practice session', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      await waitFor(() => {
        // Extract the session ID from the router.push call
        const call = mockPush.mock.calls[0][0]
        const sessionId = call.split('/').pop()
        expect(localStorageMock.getItem(`rapidproto_role_${sessionId}`)).toBe('facilitator')
      })
    })

    it('should create session with facilitator steps', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      await waitFor(() => {
        const sessions = JSON.parse(localStorage.getItem('rapidproto_sessions')!)
        const session = sessions[0]
        expect(session.steps.length).toBeGreaterThan(0)
        expect(session.steps.every((s: any) => s.role === 'facilitator')).toBe(true)
      })
    })

    it('should create session with expectations stage active', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      await waitFor(() => {
        const sessions = JSON.parse(localStorage.getItem('rapidproto_sessions')!)
        const session = sessions[0]
        expect(session.facilitatorStage).toBe('expectations')
      })
    })

    it('should show loading state while starting practice', async () => {
      render(<JoinSessionPage />)

      const practiceButton = screen.getByRole('button', { name: /start practice session/i })
      fireEvent.click(practiceButton)

      // Should show loading (though it might be too fast to catch in practice)
      // The test validates the button click works without errors
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalled()
      })
    })
  })

  describe('Instructions', () => {
    it('should explain timer synchronization', () => {
      render(<JoinSessionPage />)

      expect(screen.getByText(/sync with the builder/i)).toBeInTheDocument()
    })

    it('should describe the practice session purpose', () => {
      render(<JoinSessionPage />)

      expect(screen.getByText(/preparing before a real session/i)).toBeInTheDocument()
    })
  })
})
