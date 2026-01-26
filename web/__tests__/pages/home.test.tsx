/**
 * TDD: Landing Page Tests
 * Minimal & Sophisticated design with black/charcoal accent
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Landing Page', () => {
  it('renders the brand name with prominent typography', () => {
    render(<Home />)
    const heading = screen.getByRole('heading', { name: /rapidproto/i })
    expect(heading).toBeInTheDocument()
    expect(heading.className).toMatch(/text-5xl|text-6xl|text-7xl|font-bold/)
  })

  it('renders the tagline with muted styling', () => {
    render(<Home />)
    const tagline = screen.getByText(/discovery to demo/i)
    expect(tagline).toBeInTheDocument()
    expect(tagline.className).toMatch(/text-gray|text-muted/)
  })

  it('renders a prominent CTA button linking to /session/new', () => {
    render(<Home />)
    const cta = screen.getByRole('link', { name: /start session/i })
    expect(cta).toHaveAttribute('href', '/session/new')
    expect(cta.className).toMatch(/bg-black|bg-gray-900|bg-neutral-900/)
  })

  it('has generous whitespace with centered content', () => {
    render(<Home />)
    const main = screen.getByRole('main')
    expect(main.className).toMatch(/min-h-screen/)
    expect(main.className).toMatch(/flex/)
    expect(main.className).toMatch(/items-center|justify-center/)
  })

  it('shows the three phases with durations', () => {
    render(<Home />)
    expect(screen.getByText('Discovery')).toBeInTheDocument()
    expect(screen.getByText('Build')).toBeInTheDocument()
    expect(screen.getByText('Demo')).toBeInTheDocument()
    expect(screen.getAllByText('10 min')).toHaveLength(2) // Discovery and Demo
    expect(screen.getByText('30 min')).toBeInTheDocument()
  })

  it('renders logo mark', () => {
    render(<Home />)
    // Logo has "R" letter
    expect(screen.getByText('R')).toBeInTheDocument()
  })

  it('shows stats summary', () => {
    render(<Home />)
    expect(screen.getByText('3 phases')).toBeInTheDocument()
    expect(screen.getByText('50 minutes')).toBeInTheDocument()
    expect(screen.getByText('1 prototype')).toBeInTheDocument()
  })
})
