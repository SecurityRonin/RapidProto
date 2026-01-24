/**
 * Template Selector Component
 * Browse, search, compare, and select templates
 */

'use client'

import { useState } from 'react'
import { Search, Filter, Check, X, Eye, GitCompare } from 'lucide-react'
import { addTemplateSelection } from '@/lib/actions'
import { cn } from '@/lib/utils'

interface Template {
  number: number
  name: string
  category?: string
  buildTime?: number
  aiSuggested?: boolean
  aiReasoning?: string
}

interface PreviousSelection {
  id: string
  templateNumber: number
  templateName: string
  fitScore?: number
  fitReason?: string
  isSelected: boolean
}

interface TemplateSelectorProps {
  sessionId: string
  templates: Template[]
  previousSelections?: PreviousSelection[]
}

export function TemplateSelector({
  sessionId,
  templates,
  previousSelections = [],
}: TemplateSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')
  const [buildTimeFilter, setBuildTimeFilter] = useState<string>('')
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [fitScore, setFitScore] = useState(5)
  const [fitReason, setFitReason] = useState('')
  const [customizationNotes, setCustomizationNotes] = useState('')
  const [compareMode, setCompareMode] = useState(false)
  const [compareList, setCompareList] = useState<Set<number>>(new Set())
  const [showPreview, setShowPreview] = useState<number | null>(null)

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category).filter(Boolean)))

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      const matchesName = template.name.toLowerCase().includes(search)
      const matchesCategory = template.category?.toLowerCase().includes(search)
      if (!matchesName && !matchesCategory) return false
    }

    // Category filter
    if (categoryFilter && template.category !== categoryFilter) return false

    // Build time filter
    if (buildTimeFilter && template.buildTime) {
      const [min, max] = buildTimeFilter.split('-').map(Number)
      if (template.buildTime < min || template.buildTime > max) return false
    }

    return true
  })

  const handleSelectTemplate = (templateNumber: number) => {
    setSelectedTemplateId(templateNumber)
    setShowSelectionModal(true)
  }

  const handleConfirmSelection = async () => {
    if (!selectedTemplateId) return

    const template = templates.find(t => t.number === selectedTemplateId)
    if (!template) return

    await addTemplateSelection(sessionId, {
      templateNumber: template.number,
      templateName: template.name,
      templateCategory: template.category,
      fitScore,
      fitReason: fitReason || undefined,
      isSelected: true,
      customizationNotes: customizationNotes || undefined,
      estimatedBuildTime: template.buildTime,
      aiSuggested: template.aiSuggested,
      aiReasoning: template.aiReasoning,
    })

    setShowSelectionModal(false)
    setSelectedTemplateId(null)
    setFitScore(5)
    setFitReason('')
    setCustomizationNotes('')
  }

  const toggleCompare = (templateNumber: number) => {
    setCompareList(prev => {
      const next = new Set(prev)
      if (next.has(templateNumber)) {
        next.delete(templateNumber)
      } else {
        next.add(templateNumber)
      }
      return next
    })
  }

  const compareTemplates = templates.filter(t => compareList.has(t.number))

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white rounded-lg border p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search templates..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label htmlFor="buildTime" className="block text-sm font-medium text-gray-700 mb-1">
              Build Time
            </label>
            <select
              id="buildTime"
              value={buildTimeFilter}
              onChange={e => setBuildTimeFilter(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Duration</option>
              <option value="0-25">Under 25 min</option>
              <option value="25-35">25-35 min</option>
              <option value="35-100">Over 35 min</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
              compareMode
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            <GitCompare className="w-4 h-4" />
            Compare {compareList.size > 0 && `(${compareList.size})`}
          </button>

          {filteredTemplates.length !== templates.length && (
            <span className="text-sm text-gray-600">
              {filteredTemplates.length} of {templates.length} templates
            </span>
          )}
        </div>
      </div>

      {/* Previously Considered */}
      {previousSelections.length > 0 && (
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Previously Considered</h3>
          <div className="space-y-2">
            {previousSelections.map(selection => (
              <div
                key={selection.id}
                className="flex items-center justify-between bg-white p-3 rounded-lg"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">#{selection.templateNumber} {selection.templateName}</span>
                    {selection.isSelected && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  {selection.fitScore && (
                    <p className="text-sm text-gray-600 mt-1">
                      Fit: {selection.fitScore}/10
                      {selection.fitReason && ` - ${selection.fitReason}`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTemplates.map(template => {
          const isInCompareList = compareList.has(template.number)

          return (
            <div
              key={template.number}
              data-testid={`template-${template.number}`}
              className={cn(
                'bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow',
                isInCompareList && 'ring-2 ring-blue-500'
              )}
            >
              {/* Template Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-mono text-gray-500">#{template.number}</span>
                    {template.category && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                        {template.category}
                      </span>
                    )}
                  </div>
                  <h4 className="font-semibold text-gray-900">{template.name}</h4>
                </div>

                {compareMode && (
                  <input
                    type="checkbox"
                    checked={isInCompareList}
                    onChange={() => toggleCompare(template.number)}
                    aria-label={`Compare ${template.name}`}
                    className="w-5 h-5"
                  />
                )}
              </div>

              {/* Build Time */}
              {template.buildTime && (
                <p className="text-sm text-gray-600 mb-3">
                  {template.buildTime} min build time
                </p>
              )}

              {/* AI Suggested Badge */}
              {template.aiSuggested && (
                <div className="mb-3 relative group">
                  <span className="inline-flex items-center px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    ✨ AI Suggested
                  </span>
                  {template.aiReasoning && (
                    <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-lg z-10 w-64">
                      {template.aiReasoning}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPreview(template.number)}
                  className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                >
                  <Eye className="w-4 h-4" />
                  Preview
                </button>
                <button
                  onClick={() => handleSelectTemplate(template.number)}
                  className="flex-1 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                >
                  Select
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Comparison Table */}
      {compareList.size > 0 && (
        <div className="bg-white rounded-lg border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Template Comparison</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium text-gray-700">Template</th>
                  <th className="text-left p-2 font-medium text-gray-700">Category</th>
                  <th className="text-left p-2 font-medium text-gray-700">Build Time</th>
                  <th className="text-left p-2 font-medium text-gray-700">AI Suggested</th>
                </tr>
              </thead>
              <tbody>
                {compareTemplates.map(template => (
                  <tr key={template.number} className="border-b last:border-0">
                    <td className="p-2">
                      <div className="font-medium">#{template.number} {template.name}</div>
                    </td>
                    <td className="p-2">
                      {template.category && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {template.category}
                        </span>
                      )}
                    </td>
                    <td className="p-2">{template.buildTime} min</td>
                    <td className="p-2">
                      {template.aiSuggested ? (
                        <Check className="w-5 h-5 text-green-600" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selection Modal */}
      {showSelectionModal && selectedTemplateId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Confirm Selection</h2>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-semibold text-gray-900">
                #{selectedTemplateId} {templates.find(t => t.number === selectedTemplateId)?.name}
              </p>
            </div>

            <div>
              <label htmlFor="fitScore" className="block text-sm font-medium text-gray-700 mb-1">
                Fit Score (1-10)
              </label>
              <input
                id="fitScore"
                type="number"
                min="1"
                max="10"
                value={fitScore}
                onChange={e => setFitScore(Number(e.target.value))}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="fitReason" className="block text-sm font-medium text-gray-700 mb-1">
                Why this template?
              </label>
              <textarea
                id="fitReason"
                value={fitReason}
                onChange={e => setFitReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="customizationNotes" className="block text-sm font-medium text-gray-700 mb-1">
                Customization Notes
              </label>
              <textarea
                id="customizationNotes"
                value={customizationNotes}
                onChange={e => setCustomizationNotes(e.target.value)}
                rows={3}
                placeholder="What customizations are needed?"
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowSelectionModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSelection}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Template Preview</h2>
                <p className="text-lg text-gray-600 mt-1">
                  #{showPreview} {templates.find(t => t.number === showPreview)?.name}
                </p>
              </div>
              <button
                onClick={() => setShowPreview(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="prose max-w-none">
              <p className="text-gray-600">Template preview content would go here...</p>
              {/* In a real implementation, this would load template details, features, screenshots, etc. */}
            </div>

            <button
              onClick={() => {
                setShowPreview(null)
                handleSelectTemplate(showPreview)
              }}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Select This Template
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
