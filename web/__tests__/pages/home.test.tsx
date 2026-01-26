/**
 * TDD: Landing Page Tests
 * Dual-mode design with Builder and Facilitator role selection
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Landing Page (Dual-Mode)', () => {
  describe('Hero Section', () => {
    it('renders the headline', () => {
      render(<Home />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading.textContent).toMatch(/prototype|together/i)
    })

    it('renders the tagline about synchronized teams', () => {
      render(<Home />)
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/synchronized|builder|facilitator/i)
    })

    it('renders the badge about sprint duration', () => {
      render(<Home />)
      // Multiple elements mention 50-minute, check at least one exists
      expect(screen.getAllByText(/50-minute/i).length).toBeGreaterThan(0)
    })
  })

  describe('Role Selection Cards', () => {
    it('renders Builder card with link to /session/new', () => {
      render(<Home />)
      const builderLink = screen.getByRole('link', { name: /start building/i })
      expect(builderLink).toHaveAttribute('href', '/session/new')
    })

    it('renders Facilitator card with link to /join', () => {
      render(<Home />)
      const facilitatorLink = screen.getByRole('link', { name: /join session/i })
      expect(facilitatorLink).toHaveAttribute('href', '/join')
    })

    it('shows Builder role description', () => {
      render(<Home />)
      expect(screen.getByText(/start as builder/i)).toBeInTheDocument()
    })

    it('shows Facilitator role description', () => {
      render(<Home />)
      expect(screen.getByText(/join as facilitator/i)).toBeInTheDocument()
    })
  })

  describe('How it Works Section', () => {
    it('shows the three steps', () => {
      render(<Home />)
      expect(screen.getByText(/builder starts/i)).toBeInTheDocument()
      expect(screen.getByText(/facilitator joins/i)).toBeInTheDocument()
      expect(screen.getByText(/work in parallel/i)).toBeInTheDocument()
    })

    it('shows section heading', () => {
      render(<Home />)
      expect(screen.getByText(/how it works/i)).toBeInTheDocument()
    })
  })

  describe('Timeline Section', () => {
    it('shows the 50-minute sprint heading', () => {
      render(<Home />)
      expect(screen.getByText(/50-minute sprint/i)).toBeInTheDocument()
    })

    it('shows builder phases', () => {
      render(<Home />)
      // Builder has Discovery, Build, Verify phases
      expect(screen.getByText('Discovery')).toBeInTheDocument()
      expect(screen.getByText('Build')).toBeInTheDocument()
      expect(screen.getByText('Verify')).toBeInTheDocument()
    })

    it('shows builder label', () => {
      render(<Home />)
      expect(screen.getByText('BUILDER')).toBeInTheDocument()
    })

    it('shows facilitator label', () => {
      render(<Home />)
      expect(screen.getByText('FACILITATOR')).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders footer with brand name', () => {
      render(<Home />)
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/rapidproto/i)
    })

    it('shows tagline about prototypes', () => {
      render(<Home />)
      expect(screen.getByText(/50 minutes/i)).toBeInTheDocument()
    })
  })

  describe('Layout', () => {
    it('has full-height layout', () => {
      render(<Home />)
      const main = screen.getByRole('main')
      expect(main.className).toMatch(/min-h-screen/)
    })
  })
})
