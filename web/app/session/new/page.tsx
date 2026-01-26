'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createSession } from '@/lib/actions'
import type { Role } from '@/types/actions'
import { Wrench, Users } from 'lucide-react'

const roles: Array<{
  id: Role
  title: string
  description: string
  icon: typeof Wrench
  color: string
}> = [
  {
    id: 'builder',
    title: 'Builder',
    description: 'Technical role: Select templates, customize code, and build the MVP during the session.',
    icon: Wrench,
    color: 'blue',
  },
  {
    id: 'facilitator',
    title: 'Facilitator',
    description: 'Client-facing role: Conduct discovery, gather requirements, and present the demo.',
    icon: Users,
    color: 'purple',
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
    <div className="min-h-[calc(100vh-57px)] flex items-center justify-center p-6">
      <div className="max-w-2xl w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Start a New Session</h1>
          <p className="mt-2 text-gray-600">
            Select your role to begin the 50-minute RapidProto process
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid md:grid-cols-2 gap-4">
          {roles.map((role) => {
            const Icon = role.icon
            const isSelected = selectedRole === role.id
            const colorClasses = role.color === 'blue'
              ? 'border-blue-500 bg-blue-50 ring-blue-500'
              : 'border-purple-500 bg-purple-50 ring-purple-500'
            const iconColor = role.color === 'blue' ? 'text-blue-600' : 'text-purple-600'

            return (
              <button
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className={`p-6 rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? `${colorClasses} ring-2`
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2 rounded-lg ${isSelected ? (role.color === 'blue' ? 'bg-blue-100' : 'bg-purple-100') : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${isSelected ? iconColor : 'text-gray-600'}`} />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900">{role.title}</h2>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">{role.description}</p>
              </button>
            )
          })}
        </div>

        {/* Session Title (Optional) */}
        <div className="space-y-2">
          <label htmlFor="sessionTitle" className="block text-sm font-medium text-gray-700">
            Session Title <span className="text-gray-400">(optional)</span>
          </label>
          <input
            id="sessionTitle"
            type="text"
            value={sessionTitle}
            onChange={(e) => setSessionTitle(e.target.value)}
            placeholder="e.g., Acme Corp MVP Session"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreateSession}
          disabled={!selectedRole || isCreating}
          className="w-full py-4 px-6 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isCreating ? 'Creating Session...' : 'Start Session'}
        </button>

        {/* Phase Overview */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Session Timeline</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">Discovery</span>
            <span>10 min</span>
            <span className="text-gray-400">→</span>
            <span className="px-2 py-1 bg-green-100 text-green-800 rounded">Build</span>
            <span>30 min</span>
            <span className="text-gray-400">→</span>
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded">Demo</span>
            <span>10 min</span>
          </div>
        </div>
      </div>
    </div>
  )
}
