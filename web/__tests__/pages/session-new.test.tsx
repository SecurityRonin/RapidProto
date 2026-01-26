/**
 * TDD: Role Selection Page Tests
 * Minimal & Sophisticated design with black/charcoal accent
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

describe('Role Selection Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout', () => {
    it('renders centered content with tight max-width', () => {
      render(<NewSessionPage />)
      const container = document.querySelector('[class*="max-w"]')
      expect(container).toBeInTheDocument()
    })

    it('renders page title', () => {
      render(<NewSessionPage />)
      expect(screen.getByRole('heading', { name: /new session/i })).toBeInTheDocument()
    })
  })

  describe('Role Cards', () => {
    it('renders Builder and Facilitator role options', () => {
      render(<NewSessionPage />)
      expect(screen.getByText('Builder')).toBeInTheDocument()
      expect(screen.getByText('Facilitator')).toBeInTheDocument()
    })

    it('shows role descriptions', () => {
      render(<NewSessionPage />)
      // Builder description mentions templates/code/build
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/template|code|build/i)
      // Facilitator description mentions discovery/requirements/demo
      expect(allText).toMatch(/discovery|requirements|demo/i)
    })

    it('applies selected state styling when role is clicked', async () => {
      render(<NewSessionPage />)
      const builderCard = screen.getByText('Builder').closest('button')

      fireEvent.click(builderCard!)

      await waitFor(() => {
        expect(builderCard?.className).toMatch(/border-black|border-gray-900|ring-black|ring-gray-900|bg-gray-50/)
      })
    })
  })

  describe('Session Title Input', () => {
    it('renders optional session title input', () => {
      render(<NewSessionPage />)
      const input = screen.getByPlaceholderText(/acme|client|session/i)
      expect(input).toBeInTheDocument()
    })

    it('has minimal styling (underline or borderless)', () => {
      render(<NewSessionPage />)
      const input = screen.getByPlaceholderText(/acme|client|session/i)
      // Should have minimal border styling
      expect(input.className).toMatch(/border|underline/)
    })
  })

  describe('Start Button', () => {
    it('renders disabled when no role selected', () => {
      render(<NewSessionPage />)
      const button = screen.getByRole('button', { name: /start session/i })
      expect(button).toBeDisabled()
    })

    it('enables when role is selected', async () => {
      render(<NewSessionPage />)
      const builderCard = screen.getByText('Builder').closest('button')
      fireEvent.click(builderCard!)

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start session/i })
        expect(startButton).not.toBeDisabled()
      })
    })

    it('has black/dark background when enabled', async () => {
      render(<NewSessionPage />)
      const builderCard = screen.getByText('Builder').closest('button')
      fireEvent.click(builderCard!)

      await waitFor(() => {
        const startButton = screen.getByRole('button', { name: /start session/i })
        expect(startButton.className).toMatch(/bg-black|bg-gray-900|bg-neutral-900/)
      })
    })
  })

  describe('Timeline Preview', () => {
    it('shows the three phases with durations', () => {
      render(<NewSessionPage />)
      // Check that Discovery, Build, Demo appear in the timeline
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/discovery/i)
      expect(allText).toMatch(/build/i)
      expect(allText).toMatch(/demo/i)
      expect(allText).toMatch(/10/) // 10 min phases
      expect(allText).toMatch(/30/) // 30 min build
    })
  })
})
