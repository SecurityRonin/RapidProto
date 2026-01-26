import { ReactNode } from 'react'

interface SessionLayoutProps {
  children: ReactNode
}

export default function SessionLayout({ children }: SessionLayoutProps) {
  return (
    <div className="min-h-screen bg-white">
      {children}
    </div>
  )
}
