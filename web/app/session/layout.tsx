import Link from 'next/link'
import { ReactNode } from 'react'

interface SessionLayoutProps {
  children: ReactNode
}

export default function SessionLayout({ children }: SessionLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link href="/" className="text-lg font-semibold text-gray-900 hover:text-gray-700">
            RapidProto
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/session/new"
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              New Session
            </Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
    </div>
  )
}
