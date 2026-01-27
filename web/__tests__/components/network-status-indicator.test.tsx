/**
 * TDD: Network Status Indicator Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { NetworkStatusIndicator } from '@/components/session/network-status-indicator'

describe('NetworkStatusIndicator', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'))
  })

  describe('Visibility', () => {
    it('should not render when connected and not stale', () => {
      const { container } = render(
        <NetworkStatusIndicator
          status="connected"
          isStale={false}
          lastSyncAt={new Date()}
        />
      )

      expect(container.firstChild).toBeNull()
    })

    it('should render when disconnected', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={new Date()}
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/offline/i)).toBeInTheDocument()
    })

    it('should render when data is stale', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date(Date.now() - 60000)}
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText(/stale/i)).toBeInTheDocument()
    })
  })

  describe('Status Display', () => {
    it('should show "Offline" when disconnected', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={null}
        />
      )

      expect(screen.getByText('Offline')).toBeInTheDocument()
    })

    it('should show "Reconnecting..." when reconnecting', () => {
      render(
        <NetworkStatusIndicator
          status="reconnecting"
          isStale={false}
          lastSyncAt={null}
        />
      )

      expect(screen.getByText('Reconnecting...')).toBeInTheDocument()
    })

    it('should show "Data may be stale" when stale', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date()}
        />
      )

      expect(screen.getByText('Data may be stale')).toBeInTheDocument()
    })
  })

  describe('Last Sync Time', () => {
    it('should show seconds ago when recent', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date(Date.now() - 30000)} // 30 seconds ago
        />
      )

      expect(screen.getByText(/30s ago/)).toBeInTheDocument()
    })

    it('should show minutes ago when older', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date(Date.now() - 180000)} // 3 minutes ago
        />
      )

      expect(screen.getByText(/3m ago/)).toBeInTheDocument()
    })

    it('should show hours ago when very old', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date(Date.now() - 7200000)} // 2 hours ago
        />
      )

      expect(screen.getByText(/2h ago/)).toBeInTheDocument()
    })

    it('should not show last sync when not stale', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={new Date(Date.now() - 30000)}
        />
      )

      expect(screen.queryByText(/ago/)).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have red styling when disconnected', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={null}
        />
      )

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('bg-red-100', 'text-red-800')
    })

    it('should have yellow styling when stale', () => {
      render(
        <NetworkStatusIndicator
          status="connected"
          isStale={true}
          lastSyncAt={new Date()}
        />
      )

      const indicator = screen.getByRole('status')
      expect(indicator).toHaveClass('bg-yellow-100', 'text-yellow-800')
    })

    it('should have pulsing status dot', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={null}
        />
      )

      const dot = screen.getByRole('status').querySelector('[aria-hidden="true"]')
      expect(dot).toHaveClass('animate-pulse')
    })
  })

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={null}
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have aria-live="polite"', () => {
      render(
        <NetworkStatusIndicator
          status="disconnected"
          isStale={false}
          lastSyncAt={null}
        />
      )

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite')
    })
  })
})
