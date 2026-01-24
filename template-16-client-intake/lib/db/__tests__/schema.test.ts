import { describe, it, expect, beforeEach } from 'vitest'
import { eq, and } from 'drizzle-orm'
import { sql } from 'drizzle-orm'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import {
  clients,
  intakeForms,
  intakeSubmissions,
  conflictChecks,
  onboardingTasks,
  clientDocuments,
} from '../schema'

/**
 * TDD: Schema Tests
 * Write tests first to define behavior, then implement
 */

describe('Client Intake Schema', () => {
  let db: ReturnType<typeof drizzle>

  beforeEach(async () => {
    // Create in-memory database for testing
    const client = createClient({ url: ':memory:' })
    db = drizzle(client)

    // Create tables
    await db.run(sql`
      CREATE TABLE IF NOT EXISTS clients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL CHECK(type IN ('individual', 'business')),
        email TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        status TEXT NOT NULL DEFAULT 'prospect' CHECK(status IN ('prospect', 'active', 'inactive', 'conflict')),
        assigned_to TEXT,
        source TEXT,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS intake_forms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        firm_type TEXT NOT NULL CHECK(firm_type IN ('law', 'accounting', 'consulting', 'architecture', 'medical')),
        fields TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_by TEXT NOT NULL,
        created_at INTEGER NOT NULL
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
        status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'rejected')),
        reviewed_by TEXT,
        review_notes TEXT,
        reviewed_at INTEGER,
        submitted_at INTEGER NOT NULL,
        FOREIGN KEY (form_id) REFERENCES intake_forms(id) ON DELETE CASCADE,
        FOREIGN KEY (client_id) REFERENCES clients(id)
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS conflict_checks (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        opposing_parties TEXT,
        related_matters TEXT,
        status TEXT NOT NULL DEFAULT 'review' CHECK(status IN ('clear', 'conflict', 'review')),
        checked_by TEXT NOT NULL,
        notes TEXT,
        cleared_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS onboarding_tasks (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        assigned_to TEXT,
        due_date INTEGER,
        priority TEXT NOT NULL DEFAULT 'medium' CHECK(priority IN ('low', 'medium', 'high')),
        completed INTEGER NOT NULL DEFAULT 0,
        completed_by TEXT,
        completed_at INTEGER,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `)

    await db.run(sql`
      CREATE TABLE IF NOT EXISTS client_documents (
        id TEXT PRIMARY KEY,
        client_id TEXT NOT NULL,
        title TEXT NOT NULL,
        type TEXT,
        blob_url TEXT NOT NULL,
        extracted_data TEXT,
        uploaded_by TEXT NOT NULL,
        uploaded_at INTEGER NOT NULL,
        FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      )
    `)
  })

  describe('clients table', () => {
    it('should insert a client', async () => {
      const newClient = {
        id: 'client_1',
        name: 'Acme Corporation',
        type: 'business' as const,
        email: 'contact@acme.com',
        phone: '555-0100',
        status: 'prospect' as const,
        createdBy: 'user_1',
      }

      await db.insert(clients).values(newClient)

      const result = await db.select().from(clients).where(eq(clients.id, 'client_1'))

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Acme Corporation')
      expect(result[0].type).toBe('business')
      expect(result[0].status).toBe('prospect')
    })

    it('should enforce client type enum', async () => {
      const invalidClient = {
        id: 'client_2',
        name: 'Test',
        // @ts-expect-error Testing constraint
        type: 'invalid',
        email: 'test@test.com',
        createdBy: 'user_1',
      }

      await expect(db.insert(clients).values(invalidClient)).rejects.toThrow()
    })

    it('should default status to prospect', async () => {
      const newClient = {
        id: 'client_3',
        name: 'John Doe',
        type: 'individual' as const,
        email: 'john@example.com',
        createdBy: 'user_1',
      }

      await db.insert(clients).values(newClient)

      const result = await db.select().from(clients).where(eq(clients.id, 'client_3'))

      expect(result[0].status).toBe('prospect')
    })

    it('should auto-generate timestamps', async () => {
      const newClient = {
        id: 'client_4',
        name: 'Test Client',
        type: 'individual' as const,
        email: 'test@test.com',
        createdBy: 'user_1',
      }

      await db.insert(clients).values(newClient)

      const result = await db.select().from(clients).where(eq(clients.id, 'client_4'))

      expect(result[0].createdAt).toBeInstanceOf(Date)
      expect(result[0].updatedAt).toBeInstanceOf(Date)
    })
  })

  describe('intake_forms table', () => {
    it('should create an intake form', async () => {
      const newForm = {
        id: 'form_1',
        name: 'Law Firm Client Intake',
        firmType: 'law' as const,
        fields: JSON.stringify([
          { type: 'text', label: 'Full Name', required: true },
          { type: 'email', label: 'Email', required: true },
        ]),
        createdBy: 'user_1',
      }

      await db.insert(intakeForms).values(newForm)

      const result = await db
        .select()
        .from(intakeForms)
        .where(eq(intakeForms.id, 'form_1'))

      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('Law Firm Client Intake')
      expect(result[0].firmType).toBe('law')
      expect(result[0].isActive).toBe(true)
    })

    it('should enforce firm type enum', async () => {
      const invalidForm = {
        id: 'form_2',
        name: 'Invalid Form',
        // @ts-expect-error Testing constraint
        firmType: 'invalid',
        fields: '[]',
        createdBy: 'user_1',
      }

      await expect(db.insert(intakeForms).values(invalidForm)).rejects.toThrow()
    })
  })

  describe('intake_submissions table', () => {
    beforeEach(async () => {
      // Seed a form
      await db.insert(intakeForms).values({
        id: 'form_1',
        name: 'Test Form',
        firmType: 'law',
        fields: '[]',
        createdBy: 'user_1',
      })
    })

    it('should create a submission', async () => {
      const newSubmission = {
        id: 'sub_1',
        formId: 'form_1',
        submitterEmail: 'client@example.com',
        submitterName: 'Jane Doe',
        data: JSON.stringify({ fullName: 'Jane Doe', reason: 'New case' }),
      }

      await db.insert(intakeSubmissions).values(newSubmission)

      const result = await db
        .select()
        .from(intakeSubmissions)
        .where(eq(intakeSubmissions.id, 'sub_1'))

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('pending')
      expect(result[0].submitterEmail).toBe('client@example.com')
    })

    it('should cascade delete when form is deleted', async () => {
      await db.insert(intakeSubmissions).values({
        id: 'sub_2',
        formId: 'form_1',
        submitterEmail: 'test@test.com',
        submitterName: 'Test',
        data: '{}',
      })

      await db.delete(intakeForms).where(eq(intakeForms.id, 'form_1'))

      const result = await db.select().from(intakeSubmissions)
      expect(result).toHaveLength(0)
    })

    it('should link to client after approval', async () => {
      // Create client first
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })

      // Create submission
      await db.insert(intakeSubmissions).values({
        id: 'sub_3',
        formId: 'form_1',
        submitterEmail: 'test@test.com',
        submitterName: 'Test',
        data: '{}',
      })

      // Link submission to client
      await db
        .update(intakeSubmissions)
        .set({ clientId: 'client_1', status: 'approved' })
        .where(eq(intakeSubmissions.id, 'sub_3'))

      const result = await db
        .select()
        .from(intakeSubmissions)
        .where(eq(intakeSubmissions.id, 'sub_3'))

      expect(result[0].clientId).toBe('client_1')
      expect(result[0].status).toBe('approved')
    })
  })

  describe('conflict_checks table', () => {
    beforeEach(async () => {
      // Seed a client
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })
    })

    it('should create a conflict check', async () => {
      const newCheck = {
        id: 'check_1',
        clientId: 'client_1',
        opposingParties: JSON.stringify(['ABC Corp', 'XYZ Inc']),
        status: 'review' as const,
        checkedBy: 'user_1',
      }

      await db.insert(conflictChecks).values(newCheck)

      const result = await db
        .select()
        .from(conflictChecks)
        .where(eq(conflictChecks.id, 'check_1'))

      expect(result).toHaveLength(1)
      expect(result[0].status).toBe('review')
      expect(JSON.parse(result[0].opposingParties!)).toEqual(['ABC Corp', 'XYZ Inc'])
    })

    it('should mark as clear when no conflicts', async () => {
      await db.insert(conflictChecks).values({
        id: 'check_2',
        clientId: 'client_1',
        status: 'review',
        checkedBy: 'user_1',
      })

      await db
        .update(conflictChecks)
        .set({ status: 'clear', clearedAt: new Date() })
        .where(eq(conflictChecks.id, 'check_2'))

      const result = await db
        .select()
        .from(conflictChecks)
        .where(eq(conflictChecks.id, 'check_2'))

      expect(result[0].status).toBe('clear')
      expect(result[0].clearedAt).toBeInstanceOf(Date)
    })

    it('should cascade delete when client is deleted', async () => {
      await db.insert(conflictChecks).values({
        id: 'check_3',
        clientId: 'client_1',
        status: 'review',
        checkedBy: 'user_1',
      })

      await db.delete(clients).where(eq(clients.id, 'client_1'))

      const result = await db.select().from(conflictChecks)
      expect(result).toHaveLength(0)
    })
  })

  describe('onboarding_tasks table', () => {
    beforeEach(async () => {
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })
    })

    it('should create onboarding tasks', async () => {
      const newTask = {
        id: 'task_1',
        clientId: 'client_1',
        title: 'Send engagement letter',
        description: 'Draft and send initial engagement letter',
        assignedTo: 'user_1',
        dueDate: new Date('2024-12-31'),
        priority: 'high' as const,
      }

      await db.insert(onboardingTasks).values(newTask)

      const result = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, 'task_1'))

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Send engagement letter')
      expect(result[0].priority).toBe('high')
      expect(result[0].completed).toBe(false)
    })

    it('should mark task as completed', async () => {
      await db.insert(onboardingTasks).values({
        id: 'task_2',
        clientId: 'client_1',
        title: 'Complete intake form',
      })

      await db
        .update(onboardingTasks)
        .set({
          completed: true,
          completedBy: 'user_1',
          completedAt: new Date(),
        })
        .where(eq(onboardingTasks.id, 'task_2'))

      const result = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.id, 'task_2'))

      expect(result[0].completed).toBe(true)
      expect(result[0].completedBy).toBe('user_1')
      expect(result[0].completedAt).toBeInstanceOf(Date)
    })
  })

  describe('client_documents table', () => {
    beforeEach(async () => {
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })
    })

    it('should upload a document', async () => {
      const newDocument = {
        id: 'doc_1',
        clientId: 'client_1',
        title: 'Business License',
        type: 'business_license',
        blobUrl: 'https://blob.vercel-storage.com/doc1.pdf',
        uploadedBy: 'user_1',
      }

      await db.insert(clientDocuments).values(newDocument)

      const result = await db
        .select()
        .from(clientDocuments)
        .where(eq(clientDocuments.id, 'doc_1'))

      expect(result).toHaveLength(1)
      expect(result[0].title).toBe('Business License')
      expect(result[0].type).toBe('business_license')
    })

    it('should store AI-extracted data', async () => {
      const extractedData = {
        businessName: 'ACME Corp',
        licenseNumber: 'BL-123456',
        expiryDate: '2025-12-31',
      }

      await db.insert(clientDocuments).values({
        id: 'doc_2',
        clientId: 'client_1',
        title: 'License',
        blobUrl: 'https://example.com/doc.pdf',
        extractedData: JSON.stringify(extractedData),
        uploadedBy: 'user_1',
      })

      const result = await db
        .select()
        .from(clientDocuments)
        .where(eq(clientDocuments.id, 'doc_2'))

      expect(JSON.parse(result[0].extractedData!)).toEqual(extractedData)
    })
  })

  describe('relationships', () => {
    it('should query client with submissions', async () => {
      // Create client
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })

      // Create form
      await db.insert(intakeForms).values({
        id: 'form_1',
        name: 'Test Form',
        firmType: 'law',
        fields: '[]',
        createdBy: 'user_1',
      })

      // Create submission
      await db.insert(intakeSubmissions).values({
        id: 'sub_1',
        formId: 'form_1',
        clientId: 'client_1',
        submitterEmail: 'test@test.com',
        submitterName: 'Test',
        data: '{}',
      })

      const result = await db
        .select({
          client: clients,
          submission: intakeSubmissions,
        })
        .from(clients)
        .leftJoin(intakeSubmissions, eq(intakeSubmissions.clientId, clients.id))

      expect(result).toHaveLength(1)
      expect(result[0].client.name).toBe('Test Client')
      expect(result[0].submission?.submitterEmail).toBe('test@test.com')
    })

    it('should query client with all related data', async () => {
      await db.insert(clients).values({
        id: 'client_1',
        name: 'Test Client',
        type: 'individual',
        email: 'test@test.com',
        createdBy: 'user_1',
      })

      await db.insert(onboardingTasks).values({
        id: 'task_1',
        clientId: 'client_1',
        title: 'Task 1',
      })

      await db.insert(clientDocuments).values({
        id: 'doc_1',
        clientId: 'client_1',
        title: 'Document 1',
        blobUrl: 'https://example.com/doc.pdf',
        uploadedBy: 'user_1',
      })

      const client = await db.select().from(clients).where(eq(clients.id, 'client_1'))
      const tasks = await db
        .select()
        .from(onboardingTasks)
        .where(eq(onboardingTasks.clientId, 'client_1'))
      const documents = await db
        .select()
        .from(clientDocuments)
        .where(eq(clientDocuments.clientId, 'client_1'))

      expect(client).toHaveLength(1)
      expect(tasks).toHaveLength(1)
      expect(documents).toHaveLength(1)
    })
  })
})
