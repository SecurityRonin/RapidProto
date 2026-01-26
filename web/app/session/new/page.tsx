'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/actions'
import type { Role } from '@/types/actions'
import { Wrench, Users, Check } from 'lucide-react'

const roles: Array<{
  id: Role
  title: string
  description: string
  icon: typeof Wrench
}> = [
  {
    id: 'builder',
    title: 'Builder',
    description: 'Select templates, customize code, and build the MVP.',
    icon: Wrench,
  },
  {
    id: 'facilitator',
    title: 'Facilitator',
    description: 'Conduct discovery, gather requirements, and present the demo.',
    icon: Users,
  },
]

export default function NewSessionPage() {
  const router = useRouter()
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [sessionTitle, setSessionTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreateSession() {
    if (!selectedRole) return

    setIsCreating(true)
    setError(null)

    const result = await createSession({
      role: selectedRole,
      sessionTitle: sessionTitle.trim() || undefined,
    })

    if (result.success) {
      router.push(`/session/${result.data.id}`)
    } else {
      setError(result.error)
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="px-6 py-6">
        <a href="/" className="text-sm font-medium text-gray-400 hover:text-gray-900 transition-colors">
          RapidProto
        </a>
      </header>

      {/* Main Content */}
      <div className="max-w-lg mx-auto px-6 py-12">
        <div className="space-y-12">
          {/* Title */}
          <div>
            <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">
              New Session
            </h1>
            <p className="mt-2 text-gray-500">
              Select your role to begin
            </p>
          </div>

          {/* Role Selection */}
          <div className="space-y-3">
            {roles.map((role) => {
              const Icon = role.icon
              const isSelected = selectedRole === role.id

              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-5 rounded-2xl border-2 text-left transition-all duration-150 relative ${
                    isSelected
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-4 right-4 w-6 h-6 bg-black rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-gray-200' : 'bg-gray-100'}`}>
                      <Icon className="w-5 h-5 text-gray-700" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 pr-8">
                      <h2 className="text-lg font-medium text-gray-900">{role.title}</h2>
                      <p className="mt-1 text-sm text-gray-500 leading-relaxed">{role.description}</p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Session Title Input */}
          <div>
            <input
              type="text"
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Session title (optional)"
              className="w-full px-0 py-3 text-gray-900 placeholder-gray-400 border-0 border-b-2 border-gray-200 focus:border-gray-900 focus:ring-0 transition-colors bg-transparent"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Start Button */}
          <button
            onClick={handleCreateSession}
            disabled={!selectedRole || isCreating}
            className="w-full py-4 px-6 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isCreating ? 'Creating...' : 'Start Session'}
          </button>

          {/* Timeline Preview */}
          <div className="pt-4">
            <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>Discovery</span>
                <span className="text-gray-300">10m</span>
              </div>
              <div className="w-8 h-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>Build</span>
                <span className="text-gray-300">30m</span>
              </div>
              <div className="w-8 h-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-gray-300" />
                <span>Demo</span>
                <span className="text-gray-300">10m</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
