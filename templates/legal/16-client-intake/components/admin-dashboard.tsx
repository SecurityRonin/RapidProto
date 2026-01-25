'use client'

import { useState, useEffect } from 'react'
import { getClients, approveSubmission, runConflictCheck } from '@/lib/actions/clients'
import { getPendingSubmissions } from '@/lib/actions/admin'
import { Button } from '@/components/ui/button'
import type { Client } from '@/lib/db/schema'

/**
 * Admin dashboard for reviewing submissions and managing clients
 */

type Submission = {
  id: string
  submitterName: string
  submitterEmail: string
  status: string
  submittedAt: Date
  data: string
}

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'submissions' | 'clients' | 'analytics'>(
    'submissions'
  )
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null)
  const [approvalOptions, setApprovalOptions] = useState({
    createClient: false,
    generateTasks: false,
    sendWelcomeEmail: false,
  })
  const [rejectionNotes, setRejectionNotes] = useState('')
  const [conflictCheck, setConflictCheck] = useState<{
    submissionId: string
    opposingParties: string
  } | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadData()
  }, [activeTab, statusFilter, searchQuery])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      if (activeTab === 'submissions') {
        const result = await getPendingSubmissions()
        if (result.success) {
          setSubmissions(result.data)
        } else {
          setError(result.error)
        }
      } else if (activeTab === 'clients' || activeTab === 'analytics') {
        const filters: any = {}
        if (statusFilter) filters.status = statusFilter
        if (searchQuery) filters.search = searchQuery

        const result = await getClients(filters)
        if (result.success) {
          setClients(result.data)
        } else {
          setError(result.error)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (submissionId: string) => {
    const result = await approveSubmission(submissionId, {
      approve: true,
      createClient: approvalOptions.createClient,
      generateTasks: approvalOptions.generateTasks,
      sendWelcomeEmail: approvalOptions.sendWelcomeEmail,
    })

    if (result.success) {
      alert('Approved successfully!')
      setSelectedSubmission(null)
      loadData()
    } else {
      setError(result.error)
    }
  }

  const handleReject = async (submissionId: string) => {
    const result = await approveSubmission(submissionId, {
      approve: false,
      reviewNotes: rejectionNotes,
    })

    if (result.success) {
      alert('Rejected successfully')
      setSelectedSubmission(null)
      setRejectionNotes('')
      loadData()
    } else {
      setError(result.error)
    }
  }

  const handleConflictCheck = async () => {
    if (!conflictCheck) return

    // This would need a clientId - for now we'll create a placeholder client
    const result = await runConflictCheck({
      clientId: 'temp',
      opposingParties: conflictCheck.opposingParties
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean),
    })

    if (result.success) {
      if (result.data?.status === 'clear') {
        alert('No conflicts found!')
      } else {
        alert(`Conflict detected with ${result.data?.conflictedClients?.length} clients`)
      }
    }
    setConflictCheck(null)
  }

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        {error}
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          role="tab"
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 ${
            activeTab === 'submissions'
              ? 'border-b-2 border-blue-600 font-semibold'
              : ''
          }`}
        >
          Pending Submissions
        </button>
        <button
          role="tab"
          onClick={() => setActiveTab('clients')}
          className={`px-4 py-2 ${
            activeTab === 'clients' ? 'border-b-2 border-blue-600 font-semibold' : ''
          }`}
        >
          Clients
        </button>
        <button
          role="tab"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 ${
            activeTab === 'analytics' ? 'border-b-2 border-blue-600 font-semibold' : ''
          }`}
        >
          Analytics
        </button>
      </div>

      {/* Pending Submissions Tab */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          {submissions.map((sub) => {
            const data = JSON.parse(sub.data)
            return (
              <div key={sub.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{sub.submitterName}</h3>
                <p className="text-sm text-muted-foreground">{sub.submitterEmail}</p>
                <p className="mt-2">{data.company}</p>
                <p className="text-sm mt-1">{data.message}</p>

                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    onClick={() => setSelectedSubmission(sub.id)}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedSubmission(`reject-${sub.id}`)}
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setConflictCheck({ submissionId: sub.id, opposingParties: '' })}
                  >
                    Check Conflicts
                  </Button>
                </div>
              </div>
            )
          })}

          {/* Approval Modal */}
          {selectedSubmission && !selectedSubmission.startsWith('reject-') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg max-w-md">
                <h3 className="text-lg font-semibold mb-4">Approve Submission</h3>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={approvalOptions.createClient}
                      onChange={(e) =>
                        setApprovalOptions((prev) => ({
                          ...prev,
                          createClient: e.target.checked,
                        }))
                      }
                    />
                    Create Client
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={approvalOptions.generateTasks}
                      onChange={(e) =>
                        setApprovalOptions((prev) => ({
                          ...prev,
                          generateTasks: e.target.checked,
                        }))
                      }
                    />
                    Generate Tasks
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={approvalOptions.sendWelcomeEmail}
                      onChange={(e) =>
                        setApprovalOptions((prev) => ({
                          ...prev,
                          sendWelcomeEmail: e.target.checked,
                        }))
                      }
                    />
                    Send Welcome Email
                  </label>
                </div>
                <div className="flex gap-2 mt-6">
                  <Button onClick={() => handleApprove(selectedSubmission)}>
                    Confirm Approval
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Rejection Modal */}
          {selectedSubmission?.startsWith('reject-') && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg max-w-md">
                <h3 className="text-lg font-semibold mb-4">Reject Submission</h3>
                <label className="block mb-2">Rejection Notes</label>
                <textarea
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  className="w-full border p-2 rounded"
                  rows={3}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => handleReject(selectedSubmission.replace('reject-', ''))}
                  >
                    Confirm Rejection
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedSubmission(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Conflict Check Modal */}
          {conflictCheck && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg max-w-md">
                <h3 className="text-lg font-semibold mb-4">Conflict Check</h3>
                <label className="block mb-2">Opposing Parties (comma-separated)</label>
                <input
                  value={conflictCheck.opposingParties}
                  onChange={(e) =>
                    setConflictCheck((prev) => ({ ...prev!, opposingParties: e.target.value }))
                  }
                  className="w-full border p-2 rounded"
                  placeholder="Company A, John Smith"
                />
                <div className="flex gap-2 mt-4">
                  <Button onClick={handleConflictCheck}>Run Check</Button>
                  <Button variant="outline" onClick={() => setConflictCheck(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clients Tab */}
      {activeTab === 'clients' && (
        <div>
          <div className="flex gap-4 mb-6">
            <div>
              <label htmlFor="statusFilter" className="block text-sm mb-1">
                Filter by Status
              </label>
              <select
                id="statusFilter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border px-3 py-2 rounded"
              >
                <option value="">All</option>
                <option value="active">Active</option>
                <option value="prospect">Prospect</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label htmlFor="search" className="block text-sm mb-1">
                Search
              </label>
              <input
                id="search"
                placeholder="Search clients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border px-3 py-2 rounded"
              />
            </div>
          </div>

          <div className="space-y-4">
            {clients.map((client) => (
              <div key={client.id} className="border p-4 rounded-lg">
                <h3 className="font-semibold">{client.name}</h3>
                <p className="text-sm text-muted-foreground">{client.email}</p>
                <div className="flex gap-2 mt-2">
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                    {client.type}
                  </span>
                  <span className="text-xs px-2 py-1 bg-blue-100 rounded">
                    {client.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="grid grid-cols-3 gap-6">
          <div className="border p-6 rounded-lg">
            <h3 className="text-sm text-muted-foreground">Pending Submissions</h3>
            <p className="text-3xl font-bold mt-2">
              {submissions.filter((s) => s.status === 'pending').length}
            </p>
          </div>
          <div className="border p-6 rounded-lg">
            <h3 className="text-sm text-muted-foreground">Active Clients</h3>
            <p className="text-3xl font-bold mt-2">
              {clients.filter((c) => c.status === 'active').length}
            </p>
          </div>
          <div className="border p-6 rounded-lg">
            <h3 className="text-sm text-muted-foreground">Prospects</h3>
            <p className="text-3xl font-bold mt-2">
              {clients.filter((c) => c.status === 'prospect').length}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
