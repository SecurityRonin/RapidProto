/**
 * RapidProto Logo Component
 * Renders the SVG logo with configurable size
 */

import Image from 'next/image'
import { cn } from '@/lib/utils'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
}

const sizes = {
  sm: { logo: 32, text: 'text-lg' },
  md: { logo: 48, text: 'text-xl' },
  lg: { logo: 64, text: 'text-2xl' },
  xl: { logo: 96, text: 'text-3xl' },
}

export function Logo({ size = 'md', className, showText = true }: LogoProps) {
  const { logo, text } = sizes[size]

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Image
        src="/logo.svg"
        alt="RapidProto"
        width={logo}
        height={logo}
        className="rounded"
        priority
      />
      {showText && (
        <span className={cn('font-bold tracking-tight', text)}>
          RapidProto
        </span>
      )}
    </div>
  )
}
