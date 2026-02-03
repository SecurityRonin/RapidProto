/**
 * Client Info Form Component
 * Captures discovery phase data including Three Wins framework
 */

'use client'

import { useState, useEffect } from 'react'
import { Plus, X } from 'lucide-react'
import { saveClientInfo } from '@/lib/actions'
import { useSafeTimeout, useDebouncedCallback } from '@/hooks/use-safe-timers'
import { cn } from '@/lib/utils'
import type { ClientInfo } from '@/lib/db/schema'

interface ClientInfoFormProps {
  sessionId: string
  initialData?: Partial<ClientInfo>
  autoSave?: boolean
}

export function ClientInfoForm({ sessionId, initialData, autoSave = false }: ClientInfoFormProps) {
  const safeSetTimeout = useSafeTimeout()
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Basic info
  const [clientName, setClientName] = useState(initialData?.clientName || '')
  const [clientEmail, setClientEmail] = useState(initialData?.clientEmail || '')
  const [clientPhone, setClientPhone] = useState(initialData?.clientPhone || '')
  const [businessType, setBusinessType] = useState(initialData?.businessType || '')
  const [problemStatement, setProblemStatement] = useState(initialData?.problemStatement || '')

  // Three Wins
  const [threeWins, setThreeWins] = useState<[string, string, string]>(
    initialData?.threeWins
      ? JSON.parse(initialData.threeWins)
      : ['', '', '']
  )

  // Pain points (dynamic list)
  const [painPoints, setPainPoints] = useState<string[]>(
    initialData?.painPoints
      ? JSON.parse(initialData.painPoints)
      : ['']
  )

  // Features
  const [mustHaveFeatures, setMustHaveFeatures] = useState<string[]>(
    initialData?.mustHaveFeatures
      ? JSON.parse(initialData.mustHaveFeatures)
      : ['']
  )
  const [niceToHaveFeatures, setNiceToHaveFeatures] = useState<string[]>(
    initialData?.niceToHaveFeatures
      ? JSON.parse(initialData.niceToHaveFeatures)
      : ['']
  )

  // Budget & timeline
  const [budget, setBudget] = useState(initialData?.budget || '')
  const [timeline, setTimeline] = useState(initialData?.timeline || '')
  const [decisionMakers, setDecisionMakers] = useState(initialData?.decisionMakers || '')

  // Auto-save with debounce using safe timer hook
  const debouncedAutoSave = useDebouncedCallback(() => {
    if (clientName && problemStatement) {
      handleSave()
    }
  }, 2000)

  useEffect(() => {
    if (autoSave) {
      debouncedAutoSave()
    }
  }, [clientName, problemStatement, autoSave, debouncedAutoSave])

  const validateEmail = (email: string) => {
    if (!email) return true // Email is optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!clientName.trim()) {
      newErrors.clientName = 'Client name is required'
    }

    if (!problemStatement.trim()) {
      newErrors.problemStatement = 'Problem statement is required'
    }

    if (clientEmail && !validateEmail(clientEmail)) {
      newErrors.clientEmail = 'Invalid email format'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return

    setIsSaving(true)
    setSaveSuccess(false)

    try {
      await saveClientInfo(sessionId, {
        clientName,
        clientEmail: clientEmail || undefined,
        clientPhone: clientPhone || undefined,
        businessType: businessType || undefined,
        problemStatement,
        threeWins: threeWins.filter(w => w.trim()).length > 0 ? threeWins.filter(w => w.trim()) : undefined,
        painPoints: painPoints.filter(p => p.trim()).length > 0 ? painPoints.filter(p => p.trim()) : undefined,
        mustHaveFeatures: mustHaveFeatures.filter(f => f.trim()).length > 0 ? mustHaveFeatures.filter(f => f.trim()) : undefined,
        niceToHaveFeatures: niceToHaveFeatures.filter(f => f.trim()).length > 0 ? niceToHaveFeatures.filter(f => f.trim()) : undefined,
        budget: budget || undefined,
        timeline: timeline || undefined,
        decisionMakers: decisionMakers || undefined,
      })

      setSaveSuccess(true)
      safeSetTimeout(() => setSaveSuccess(false), 3000)
    } catch (error) {
      console.error('Failed to save client info:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const addPainPoint = () => {
    setPainPoints([...painPoints, ''])
  }

  const removePainPoint = (index: number) => {
    setPainPoints(painPoints.filter((_, i) => i !== index))
  }

  const addMustHave = () => {
    setMustHaveFeatures([...mustHaveFeatures, ''])
  }

  const removeMustHave = (index: number) => {
    setMustHaveFeatures(mustHaveFeatures.filter((_, i) => i !== index))
  }

  const addNiceToHave = () => {
    setNiceToHaveFeatures([...niceToHaveFeatures, ''])
  }

  const removeNiceToHave = (index: number) => {
    setNiceToHaveFeatures(niceToHaveFeatures.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-6">
      {/* Basic Info Section */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-1">
            Client Name *
          </label>
          <input
            id="clientName"
            type="text"
            value={clientName}
            onChange={e => setClientName(e.target.value)}
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.clientName && 'border-red-500'
            )}
          />
          {errors.clientName && (
            <p className="mt-1 text-sm text-red-600">{errors.clientName}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="clientEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="clientEmail"
              type="email"
              value={clientEmail}
              onChange={e => setClientEmail(e.target.value)}
              className={cn(
                'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
                errors.clientEmail && 'border-red-500'
              )}
            />
            {errors.clientEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.clientEmail}</p>
            )}
          </div>

          <div>
            <label htmlFor="clientPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              id="clientPhone"
              type="tel"
              value={clientPhone}
              onChange={e => setClientPhone(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="businessType" className="block text-sm font-medium text-gray-700 mb-1">
            Business Type
          </label>
          <input
            id="businessType"
            type="text"
            value={businessType}
            onChange={e => setBusinessType(e.target.value)}
            placeholder="e.g., Manufacturing, Retail, Services"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="problemStatement" className="block text-sm font-medium text-gray-700 mb-1">
            Problem Statement *
          </label>
          <textarea
            id="problemStatement"
            value={problemStatement}
            onChange={e => setProblemStatement(e.target.value)}
            rows={3}
            placeholder="What problem are they trying to solve?"
            className={cn(
              'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500',
              errors.problemStatement && 'border-red-500'
            )}
          />
          {errors.problemStatement && (
            <p className="mt-1 text-sm text-red-600">{errors.problemStatement}</p>
          )}
        </div>
      </div>

      {/* Three Wins Framework */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Three Wins Framework</h3>
          <p className="text-sm text-gray-600 mt-1">
            What are the top 3 outcomes the client wants to achieve?
          </p>
        </div>

        {[0, 1, 2].map((index) => (
          <div key={index}>
            <label htmlFor={`win-${index}`} className="block text-sm font-medium text-gray-700 mb-1">
              Win #{index + 1}
            </label>
            <input
              id={`win-${index}`}
              type="text"
              value={threeWins[index]}
              onChange={e => {
                const newWins: [string, string, string] = [...threeWins] as [string, string, string]
                newWins[index] = e.target.value
                setThreeWins(newWins)
              }}
              placeholder={`Win #${index + 1}`}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            />
          </div>
        ))}
      </div>

      {/* Pain Points */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Pain Points</h3>
          <button
            type="button"
            onClick={addPainPoint}
            className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
          >
            <Plus className="w-4 h-4" />
            Add pain point
          </button>
        </div>

        {painPoints.map((pain, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={pain}
              onChange={e => {
                const newPains = [...painPoints]
                newPains[index] = e.target.value
                setPainPoints(newPains)
              }}
              placeholder="Pain point"
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {painPoints.length > 1 && (
              <button
                type="button"
                onClick={() => removePainPoint(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                aria-label="Remove"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Features Section */}
      <div className="bg-white rounded-lg border p-6 space-y-6">
        {/* Must-Have Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Must-Have Features</h3>
            <button
              type="button"
              onClick={addMustHave}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="w-4 h-4" />
              Add must-have
            </button>
          </div>

          {mustHaveFeatures.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={e => {
                  const newFeatures = [...mustHaveFeatures]
                  newFeatures[index] = e.target.value
                  setMustHaveFeatures(newFeatures)
                }}
                placeholder="Must-have feature"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {mustHaveFeatures.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeMustHave(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>

        {/* Nice-to-Have Features */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Nice-to-Have Features</h3>
            <button
              type="button"
              onClick={addNiceToHave}
              className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
            >
              <Plus className="w-4 h-4" />
              Add nice-to-have
            </button>
          </div>

          {niceToHaveFeatures.map((feature, index) => (
            <div key={index} className="flex gap-2">
              <input
                type="text"
                value={feature}
                onChange={e => {
                  const newFeatures = [...niceToHaveFeatures]
                  newFeatures[index] = e.target.value
                  setNiceToHaveFeatures(newFeatures)
                }}
                placeholder="Nice-to-have feature"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {niceToHaveFeatures.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeNiceToHave(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded"
                  aria-label="Remove"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Budget & Timeline */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Budget & Timeline</h3>

        <div>
          <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
            Budget
          </label>
          <input
            id="budget"
            type="text"
            value={budget}
            onChange={e => setBudget(e.target.value)}
            placeholder="e.g., $5,000-$10,000"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="timeline" className="block text-sm font-medium text-gray-700 mb-1">
            Timeline
          </label>
          <input
            id="timeline"
            type="text"
            value={timeline}
            onChange={e => setTimeline(e.target.value)}
            placeholder="e.g., Need by end of Q2"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="decisionMakers" className="block text-sm font-medium text-gray-700 mb-1">
            Decision Makers
          </label>
          <input
            id="decisionMakers"
            type="text"
            value={decisionMakers}
            onChange={e => setDecisionMakers(e.target.value)}
            placeholder="Who needs to approve?"
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between">
        <div>
          {autoSave && isSaving && (
            <span className="text-sm text-gray-600">Saving...</span>
          )}
          {saveSuccess && (
            <span className="text-sm text-green-600">Saved successfully!</span>
          )}
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className={cn(
            'px-6 py-2 bg-blue-600 text-white rounded-lg font-medium',
            'hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {isSaving ? 'Saving...' : 'Save Client Info'}
        </button>
      </div>
    </form>
  )
}
