import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  createClient,
  getClients,
  updateClientStatus,
  assignClient,
  runConflictCheck,
  approveSubmission,
} from '../clients'
import { createClient as createDbClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { sql } from 'drizzle-orm'

/**
 * TDD: Server Actions Tests
 * Write tests first to define expected behavior
 */

// Mock Clerk auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123' })),
  currentUser: vi.fn(() => ({
    id: 'user_test123',
    emailAddresses: [{ emailAddress: 'test@firm.com' }],
    firstName: 'Test',
    lastName: 'Partner',
  })),
}))

describe('Client Actions', () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(async () => {
    // Reset database
    const client = createDbClient({ url: ':memory:' })
    db = drizzle(client)

    // Create tables (simplified for test)
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        status TEXT NOT NULL DEFAULT 'prospect',
        assigned_to TEXT,
        source TEXT,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS intake_submissions (
        id TEXT PRIMARY KEY,
        form_id TEXT NOT NULL,
        client_id TEXT,
        submitter_email TEXT NOT NULL,
        submitter_name TEXT NOT NULL,
        data TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        reviewed_by TEXT,
        review_notes TEXT,
        reviewed_at INTEGER,
        submitted_at INTEGER NOT NULL
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS conflict_checks (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        opposing_parties TEXT,
        related_matters TEXT,
        status TEXT NOT NULL DEFAULT 'review',
        checked_by TEXT NOT NULL,
        notes TEXT,
        cleared_at INTEGER,
        created_at INTEGER NOT NULL
      )
    `)
  })

  describe('createClient', () => {
    it('should create a new client', async () => {
      const result = await createClient({
        name: 'ACME Corporation',
        type: 'business',
        email: 'contact@acme.com',
        phone: '555-0100',
        source: 'referral',
      })

      expect(result.success).toBe(true)
      expect(result.data?.name).toBe('ACME Corporation')
      expect(result.data?.type).toBe('business')
      expect(result.data?.status).toBe('prospect')
      expect(result.data?.createdBy).toBe('user_test123')
    })

    it('should validate required fields', async () => {
      const result = await createClient({
        // @ts-expect-error Testing validation
        name: '',
        type: 'business',
        email: 'test@test.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('name')
    })

    it('should validate email format', async () => {
      const result = await createClient({
        name: 'Test Client',
        type: 'individual',
        email: 'invalid-email',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('email')
    })

    it('should reject unauthenticated requests', async () => {
      const { auth } = await import('@clerk/nextjs')
      vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

      const result = await createClient({
        name: 'Test',
        type: 'individual',
        email: 'test@test.com',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('should auto-generate conflict check for new law firm client', async () => {
      const result = await createClient({
        name: 'John Doe',
        type: 'individual',
        email: 'john@example.com',
        autoConflictCheck: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.conflictCheckId).toBeDefined()
    })
  })

  describe('getClients', () => {
    beforeEach(async () => {
      await createClient({
        name: 'Client A',
        type: 'business',
        email: 'a@test.com',
      })

      await createClient({
        name: 'Client B',
        type: 'individual',
        email: 'b@test.com',
      })
    })

    it('should return all clients for user', async () => {
      const result = await getClients()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      // Update one client to active
      const clients = await getClients()
      await updateClientStatus(clients.data![0].id, 'active')

      const result = await getClients({ status: 'active' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].status).toBe('active')
    })

    it('should filter by type', async () => {
      const result = await getClients({ type: 'business' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].type).toBe('business')
    })

    it('should search by name', async () => {
      const result = await getClients({ search: 'Client A' })

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data![0].name).toContain('Client A')
    })
  })

  describe('updateClientStatus', () => {
    it('should update client status', async () => {
      const client = await createClient({
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
      })

      const result = await updateClientStatus(client.data!.id, 'active')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('active')
    })

    it('should validate status enum', async () => {
      const client = await createClient({
        name: 'Test',
        type: 'individual',
        email: 'test@test.com',
      })

      const result = await updateClientStatus(
        client.data!.id,
        // @ts-expect-error Testing validation
        'invalid_status'
      )

      expect(result.success).toBe(false)
    })

    it('should not update non-existent client', async () => {
      const result = await updateClientStatus('nonexistent', 'active')

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })

  describe('assignClient', () => {
    it('should assign client to partner/manager', async () => {
      const client = await createClient({
        name: 'Test Client',
        type: 'business',
        email: 'test@test.com',
      })

      const result = await assignClient(client.data!.id, 'user_partner123')

      expect(result.success).toBe(true)
      expect(result.data?.assignedTo).toBe('user_partner123')
    })

    it('should allow reassignment', async () => {
      const client = await createClient({
        name: 'Test',
        type: 'individual',
        email: 'test@test.com',
      })

      await assignClient(client.data!.id, 'user_partner1')
      const result = await assignClient(client.data!.id, 'user_partner2')

      expect(result.success).toBe(true)
      expect(result.data?.assignedTo).toBe('user_partner2')
    })
  })

  describe('runConflictCheck', () => {
    it('should create a conflict check', async () => {
      const client = await createClient({
        name: 'Plaintiff Corp',
        type: 'business',
        email: 'plaintiff@example.com',
      })

      const result = await runConflictCheck({
        clientId: client.data!.id,
        opposingParties: ['Defendant Inc', 'John Doe'],
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('review')
      expect(result.data?.opposingParties).toEqual(['Defendant Inc', 'John Doe'])
    })

    it('should detect conflict with existing client', async () => {
      // Create existing client "Defendant Inc"
      await createClient({
        name: 'Defendant Inc',
        type: 'business',
        email: 'defendant@example.com',
        source: 'existing',
      })

      // Try to onboard opposing party
      const newClient = await createClient({
        name: 'Plaintiff Corp',
        type: 'business',
        email: 'plaintiff@example.com',
      })

      const result = await runConflictCheck({
        clientId: newClient.data!.id,
        opposingParties: ['Defendant Inc'],
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('conflict')
      expect(result.data?.conflictedClients).toHaveLength(1)
      expect(result.data?.conflictedClients![0].name).toBe('Defendant Inc')
    })

    it('should clear when no conflicts found', async () => {
      const client = await createClient({
        name: 'New Client',
        type: 'individual',
        email: 'new@example.com',
      })

      const result = await runConflictCheck({
        clientId: client.data!.id,
        opposingParties: ['Unknown Party'],
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('clear')
    })

    it('should allow manual override with notes', async () => {
      const client = await createClient({
        name: 'Test',
        type: 'individual',
        email: 'test@test.com',
      })

      const check = await runConflictCheck({
        clientId: client.data!.id,
        opposingParties: ['Test Party'],
      })

      const result = await runConflictCheck({
        clientId: client.data!.id,
        opposingParties: ['Test Party'],
        override: true,
        notes: 'Reviewed by managing partner, no actual conflict',
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('clear')
      expect(result.data?.notes).toContain('managing partner')
    })
  })

  describe('approveSubmission', () => {
    beforeEach(async () => {
      // Seed submission
      await db.run(sql`
        INSERT INTO intake_submissions (
          id, form_id, submitter_email, submitter_name, data, submitted_at
        ) VALUES (
          'sub_1', 'form_1', 'john@example.com', 'John Doe',
          '{"fullName": "John Doe", "company": "ACME"}',
          ${Date.now()}
        )
      `)
    })

    it('should approve submission and create client', async () => {
      const result = await approveSubmission('sub_1', {
        createClient: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.clientId).toBeDefined()
      expect(result.data?.client?.name).toBeDefined()
      expect(result.data?.submission.status).toBe('approved')
    })

    it('should generate onboarding tasks on approval', async () => {
      const result = await approveSubmission('sub_1', {
        createClient: true,
        generateTasks: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.tasks).toBeDefined()
      expect(result.data?.tasks!.length).toBeGreaterThan(0)
    })

    it('should send welcome email to client', async () => {
      const mockSend = vi.fn()
      vi.mock('resend', () => ({
        Resend: vi.fn(() => ({
          emails: { send: mockSend },
        })),
      }))

      const result = await approveSubmission('sub_1', {
        createClient: true,
        sendWelcomeEmail: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.emailSent).toBe(true)
    })

    it('should reject submission with notes', async () => {
      const result = await approveSubmission('sub_1', {
        approve: false,
        reviewNotes: 'Missing required documents',
      })

      expect(result.success).toBe(true)
      expect(result.data?.submission.status).toBe('rejected')
      expect(result.data?.submission.reviewNotes).toContain('Missing required')
    })
  })

  describe('edge cases', () => {
    it('should handle duplicate client names differently by type', async () => {
      await createClient({
        name: 'John Smith',
        type: 'individual',
        email: 'john1@example.com',
      })

      // Same name but different type should be allowed
      const result = await createClient({
        name: 'John Smith',
        type: 'business', // Different type
        email: 'john2@example.com', // Different email
      })

      expect(result.success).toBe(true)
    })

    it('should prevent duplicate emails', async () => {
      await createClient({
        name: 'Client A',
        type: 'individual',
        email: 'same@example.com',
      })

      const result = await createClient({
        name: 'Client B',
        type: 'individual',
        email: 'same@example.com', // Duplicate email
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('email already exists')
    })

    it('should handle address as JSON', async () => {
      const result = await createClient({
        name: 'Test Client',
        type: 'business',
        email: 'test@test.com',
        address: {
          street: '123 Main St',
          city: 'Springfield',
          state: 'IL',
          zip: '62701',
        },
      })

      expect(result.success).toBe(true)
      expect(typeof result.data?.address).toBe('string') // Stored as JSON string
      expect(JSON.parse(result.data!.address!)).toMatchObject({
        street: '123 Main St',
        city: 'Springfield',
      })
    })
  })
})
