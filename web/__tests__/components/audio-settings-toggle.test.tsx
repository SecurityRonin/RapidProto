/**
 * TDD: Audio Settings Toggle Tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AudioSettingsToggle } from '@/components/session/audio-settings-toggle'

describe('AudioSettingsToggle', () => {
  describe('Toggle Button', () => {
    it('should render toggle button', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toBeInTheDocument()
    })

    it('should call onToggle when clicked', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      fireEvent.click(screen.getByRole('switch'))
      expect(onToggle).toHaveBeenCalledTimes(1)
    })

    it('should show aria-checked="true" when enabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={true} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'true')
    })

    it('should show aria-checked="false" when disabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false')
    })
  })

  describe('Status Display', () => {
    it('should show "Sound on" when enabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={true} onToggle={onToggle} />)

      expect(screen.getByText(/sound on/i)).toBeInTheDocument()
    })

    it('should show "Sound off" when disabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      expect(screen.getByText(/sound off/i)).toBeInTheDocument()
    })
  })

  describe('Volume Control', () => {
    it('should not show volume slider by default', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={true} onToggle={onToggle} />)

      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('should show volume slider when showVolume is true', () => {
      const onToggle = vi.fn()
      const onVolumeChange = vi.fn()
      render(
        <AudioSettingsToggle
          enabled={true}
          onToggle={onToggle}
          showVolume
          onVolumeChange={onVolumeChange}
        />
      )

      expect(screen.getByRole('slider')).toBeInTheDocument()
    })

    it('should not show volume slider when disabled even with showVolume', () => {
      const onToggle = vi.fn()
      const onVolumeChange = vi.fn()
      render(
        <AudioSettingsToggle
          enabled={false}
          onToggle={onToggle}
          showVolume
          onVolumeChange={onVolumeChange}
        />
      )

      expect(screen.queryByRole('slider')).not.toBeInTheDocument()
    })

    it('should call onVolumeChange when slider changes', () => {
      const onToggle = vi.fn()
      const onVolumeChange = vi.fn()
      render(
        <AudioSettingsToggle
          enabled={true}
          onToggle={onToggle}
          showVolume
          volume={0.5}
          onVolumeChange={onVolumeChange}
        />
      )

      const slider = screen.getByRole('slider')
      fireEvent.change(slider, { target: { value: '0.8' } })

      expect(onVolumeChange).toHaveBeenCalledWith(0.8)
    })

    it('should display current volume percentage', () => {
      const onToggle = vi.fn()
      const onVolumeChange = vi.fn()
      render(
        <AudioSettingsToggle
          enabled={true}
          onToggle={onToggle}
          showVolume
          volume={0.7}
          onVolumeChange={onVolumeChange}
        />
      )

      expect(screen.getByText('70%')).toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have green background when enabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={true} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveClass('bg-green-600')
    })

    it('should have gray background when disabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveClass('bg-gray-300')
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate aria-label when enabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={true} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-label',
        'Disable audio notifications'
      )
    })

    it('should have appropriate aria-label when disabled', () => {
      const onToggle = vi.fn()
      render(<AudioSettingsToggle enabled={false} onToggle={onToggle} />)

      expect(screen.getByRole('switch')).toHaveAttribute(
        'aria-label',
        'Enable audio notifications'
      )
    })

    it('should have aria-label on volume slider', () => {
      const onToggle = vi.fn()
      const onVolumeChange = vi.fn()
      render(
        <AudioSettingsToggle
          enabled={true}
          onToggle={onToggle}
          showVolume
          onVolumeChange={onVolumeChange}
        />
      )

      expect(screen.getByRole('slider')).toHaveAttribute('aria-label', 'Volume')
    })
  })
})
