/**
 * TDD: Landing Page Tests
 * Clean design with shadcn/ui components
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Landing Page', () => {
  describe('Hero Section', () => {
    it('renders the headline', () => {
      render(<Home />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
      expect(heading.textContent).toMatch(/prototype|50 minutes/i)
    })

    it('renders the tagline', () => {
      render(<Home />)
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/stop overthinking|focused/i)
    })

    it('renders the badge', () => {
      render(<Home />)
      expect(screen.getByText(/solo developer/i)).toBeInTheDocument()
    })
  })

  describe('CTA Buttons', () => {
    it('renders Start Session button linking to /session/new', () => {
      render(<Home />)
      const ctas = screen.getAllByRole('link', { name: /start session/i })
      expect(ctas.length).toBeGreaterThan(0)
      expect(ctas[0]).toHaveAttribute('href', '/session/new')
    })

    it('renders How it works button', () => {
      render(<Home />)
      const howItWorks = screen.getByRole('link', { name: /how it works/i })
      expect(howItWorks).toBeInTheDocument()
    })
  })

  describe('How it Works Section', () => {
    it('shows the three phases', () => {
      render(<Home />)
      expect(screen.getByText('Discover')).toBeInTheDocument()
      expect(screen.getByText('Build')).toBeInTheDocument()
      expect(screen.getByText('Verify')).toBeInTheDocument()
    })

    it('shows phase durations', () => {
      render(<Home />)
      expect(screen.getAllByText('10 min')).toHaveLength(2) // Discover and Verify
      expect(screen.getByText('30 min')).toBeInTheDocument()
    })

    it('shows section heading', () => {
      render(<Home />)
      expect(screen.getByText(/50-minute framework/i)).toBeInTheDocument()
    })
  })

  describe('Bottom CTA Section', () => {
    it('renders secondary CTA card', () => {
      render(<Home />)
      expect(screen.getByText(/ready to build/i)).toBeInTheDocument()
    })
  })

  describe('Footer', () => {
    it('renders footer with brand name', () => {
      render(<Home />)
      // Footer has RapidProto text
      const allText = document.body.textContent || ''
      expect(allText).toMatch(/rapidproto/i)
    })

    it('shows tagline about builders', () => {
      render(<Home />)
      expect(screen.getByText(/built for builders/i)).toBeInTheDocument()
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
