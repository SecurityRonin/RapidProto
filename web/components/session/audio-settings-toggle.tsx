/**
 * Audio Settings Toggle Component
 * Allows users to enable/disable audio notifications
 */

'use client'

import { cn } from '@/lib/utils'

interface AudioSettingsToggleProps {
  enabled: boolean
  onToggle: () => void
  volume?: number
  onVolumeChange?: (volume: number) => void
  showVolume?: boolean
  className?: string
}

export function AudioSettingsToggle({
  enabled,
  onToggle,
  volume = 0.5,
  onVolumeChange,
  showVolume = false,
  className,
}: AudioSettingsToggleProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
          enabled ? 'bg-green-600' : 'bg-gray-300'
        )}
        role="switch"
        aria-checked={enabled}
        aria-label={enabled ? 'Disable audio notifications' : 'Enable audio notifications'}
      >
        <span
          className={cn(
            'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
            enabled ? 'translate-x-6' : 'translate-x-1'
          )}
        />
      </button>

      <span className="text-sm text-gray-700">
        {enabled ? (
          <span className="flex items-center gap-1">
            <SpeakerIcon className="w-4 h-4" />
            Sound on
          </span>
        ) : (
          <span className="flex items-center gap-1">
            <SpeakerOffIcon className="w-4 h-4" />
            Sound off
          </span>
        )}
      </span>

      {showVolume && enabled && onVolumeChange && (
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            aria-label="Volume"
          />
          <span className="text-xs text-gray-500 w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      )}
    </div>
  )
}

function SpeakerIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  )
}

function SpeakerOffIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}
