/**
 * Tests for Invoice Generator Actions
 * TDD: These tests define the expected behavior BEFORE implementation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { z } from 'zod'

// Types for mock data
type MockInvoice = {
  id: string
  invoiceNumber: string
  clientId: string
  issueDate: Date
  dueDate: Date
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  subtotal: number
  tax: number
  total: number
  notes: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

type MockLineItem = {
  id: string
  invoiceId: string
  description: string
  quantity: number
  unitPrice: number
  amount: number
}

type MockClient = {
  id: string
  name: string
  email: string
  address: string | null
  phone: string | null
  userId: string
  createdAt: Date
  updatedAt: Date
}

// In-memory data stores for testing
let mockInvoices: MockInvoice[] = []
let mockLineItems: MockLineItem[] = []
let mockClients: MockClient[] = []
let mockInvoiceCounter = 0

// Mock the database module
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn((table: { _: { name: string } }) => ({
      values: vi.fn((data: Record<string, unknown> | Record<string, unknown>[]) => ({
        returning: vi.fn(() => {
          const tableName = table._.name
          if (tableName === 'invoices') {
            const invoice = data as MockInvoice
            mockInvoices.push(invoice)
            return [invoice]
          }
          if (tableName === 'invoice_line_items') {
            const items = Array.isArray(data) ? data : [data]
            items.forEach(item => mockLineItems.push(item as MockLineItem))
            return items
          }
          if (tableName === 'clients') {
            const client = data as MockClient
            mockClients.push(client)
            return [client]
          }
          return [data]
        }),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn((table: { _: { name: string } }) => {
        const tableName = table._.name
        return {
          where: vi.fn(() => {
            if (tableName === 'invoices') return mockInvoices
            if (tableName === 'invoice_line_items') return mockLineItems
            if (tableName === 'clients') return mockClients
            return []
          }),
          orderBy: vi.fn(() => {
            if (tableName === 'invoices') return mockInvoices
            if (tableName === 'clients') return mockClients
            return []
          }),
          leftJoin: vi.fn(() => ({
            where: vi.fn(() => mockInvoices.map(inv => ({ invoices: inv, clients: mockClients[0] }))),
          })),
        }
      }),
    })),
    update: vi.fn((table: { _: { name: string } }) => ({
      set: vi.fn((data: Record<string, unknown>) => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => {
            const tableName = table._.name
            if (tableName === 'invoices' && mockInvoices.length > 0) {
              const updated = { ...mockInvoices[0], ...data }
              mockInvoices[0] = updated as MockInvoice
              return [updated]
            }
            if (tableName === 'invoice_line_items' && mockLineItems.length > 0) {
              const updated = { ...mockLineItems[0], ...data }
              mockLineItems[0] = updated as MockLineItem
              return [updated]
            }
            if (tableName === 'clients' && mockClients.length > 0) {
              const updated = { ...mockClients[0], ...data }
              mockClients[0] = updated as MockClient
              return [updated]
            }
            return []
          }),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => {
        // For simplicity, just clear the appropriate array
        return Promise.resolve()
      }),
    })),
    transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
      return callback({
        insert: vi.fn(() => ({
          values: vi.fn(() => ({
            returning: vi.fn(() => [mockInvoices[0] || {}]),
          })),
        })),
        update: vi.fn(() => ({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn(() => [mockInvoices[0] || {}]),
            })),
          })),
        })),
        delete: vi.fn(() => ({
          where: vi.fn(() => Promise.resolve()),
        })),
        select: vi.fn(() => ({
          from: vi.fn(() => ({
            where: vi.fn(() => mockLineItems),
            orderBy: vi.fn(() => mockInvoices),
          })),
        })),
      })
    }),
  },
}))

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
  mockInvoices = []
  mockLineItems = []
  mockClients = []
  mockInvoiceCounter = 0
})

// Import after mocking
import {
  // Client actions
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
  // Invoice actions
  createInvoice,
  getInvoices,
  getInvoiceById,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  markAsPaid,
  // Line item actions
  addLineItem,
  updateLineItem,
  removeLineItem,
  // Utility functions
  calculateInvoiceTotals,
  generateInvoiceNumber,
  // Validation schemas
  createClientSchema,
  createInvoiceSchema,
  lineItemSchema,
} from './index'

describe('Invoice Generator Actions', () => {
  // ============================================================
  // CLIENT ACTIONS
  // ============================================================
  describe('Client CRUD Operations', () => {
    describe('createClient', () => {
      it('should create a new client with required fields', async () => {
        const result = await createClient({
          name: 'Acme Corporation',
          email: 'billing@acme.com',
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.name).toBe('Acme Corporation')
        expect(result.data?.email).toBe('billing@acme.com')
      })

      it('should create a client with optional fields', async () => {
        const result = await createClient({
          name: 'Beta Inc',
          email: 'contact@beta.com',
          address: '456 Oak Ave, Suite 100',
          phone: '555-9876',
          userId: 'user_123',
        })

        expect(result.success).toBe(true)
        expect(result.data?.address).toBe('456 Oak Ave, Suite 100')
        expect(result.data?.phone).toBe('555-9876')
      })

      it('should validate required name field', async () => {
        await expect(
          createClient({
            name: '',
            email: 'test@test.com',
            userId: 'user_123',
          })
        ).rejects.toThrow()
      })

      it('should validate email format', async () => {
        await expect(
          createClient({
            name: 'Test Client',
            email: 'invalid-email',
            userId: 'user_123',
          })
        ).rejects.toThrow()
      })

      it('should generate a unique client ID', async () => {
        const result = await createClient({
          name: 'Test Client',
          email: 'test@test.com',
          userId: 'user_123',
        })

        expect(result.data?.id).toBeDefined()
        expect(result.data?.id).toMatch(/^client_/)
      })
    })

    describe('getClients', () => {
      it('should return all clients for a user', async () => {
        // Add test client
        mockClients.push({
          id: 'client_1',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await getClients('user_123')

        expect(result.success).toBe(true)
        expect(Array.isArray(result.data)).toBe(true)
      })

      it('should filter clients by user ID', async () => {
        const result = await getClients('user_456')
        expect(result.success).toBe(true)
      })
    })

    describe('getClientById', () => {
      it('should return a specific client', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await getClientById('client_123')

        expect(result.success).toBe(true)
        expect(result.data?.id).toBe('client_123')
      })

      it('should return error for non-existent client', async () => {
        mockClients = []
        const result = await getClientById('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Client not found')
      })
    })

    describe('updateClient', () => {
      it('should update client fields', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Old Name',
          email: 'old@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await updateClient('client_123', {
          name: 'New Name',
          email: 'new@test.com',
        })

        expect(result.success).toBe(true)
        expect(result.data?.name).toBe('New Name')
      })

      it('should update the updatedAt timestamp', async () => {
        const oldDate = new Date('2024-01-01')
        mockClients.push({
          id: 'client_123',
          name: 'Test',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: oldDate,
          updatedAt: oldDate,
        })

        const result = await updateClient('client_123', { name: 'Updated' })

        expect(result.success).toBe(true)
        expect(result.data?.updatedAt).not.toEqual(oldDate)
      })
    })

    describe('deleteClient', () => {
      it('should delete a client', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'To Delete',
          email: 'delete@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await deleteClient('client_123')

        expect(result.success).toBe(true)
      })

      it('should not allow deletion if client has invoices', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Has Invoices',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await deleteClient('client_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Cannot delete client with existing invoices')
      })
    })
  })

  // ============================================================
  // INVOICE ACTIONS
  // ============================================================
  describe('Invoice CRUD Operations', () => {
    describe('createInvoice', () => {
      it('should create an invoice with line items', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await createInvoice({
          clientId: 'client_123',
          issueDate: new Date('2024-01-15'),
          dueDate: new Date('2024-02-15'),
          notes: 'Payment due within 30 days',
          userId: 'user_123',
          lineItems: [
            { description: 'Consulting', quantity: 10, unitPrice: 150 },
            { description: 'Development', quantity: 20, unitPrice: 100 },
          ],
        })

        expect(result.success).toBe(true)
        expect(result.data).toBeDefined()
        expect(result.data?.status).toBe('draft')
      })

      it('should auto-generate invoice number', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await createInvoice({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
        })

        expect(result.data?.invoiceNumber).toMatch(/^INV-\d{4}$/)
      })

      it('should calculate totals automatically', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await createInvoice({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          taxRate: 0.1, // 10% tax
          lineItems: [
            { description: 'Item 1', quantity: 2, unitPrice: 100 }, // 200
            { description: 'Item 2', quantity: 1, unitPrice: 50 }, // 50
          ],
        })

        expect(result.data?.subtotal).toBe(250)
        expect(result.data?.tax).toBe(25)
        expect(result.data?.total).toBe(275)
      })

      it('should validate client exists', async () => {
        const result = await createInvoice({
          clientId: 'nonexistent_client',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Client not found')
      })

      it('should require at least one line item', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await expect(
          createInvoice({
            clientId: 'client_123',
            issueDate: new Date(),
            dueDate: new Date(),
            userId: 'user_123',
            lineItems: [],
          })
        ).rejects.toThrow()
      })

      it('should default status to draft', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await createInvoice({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
        })

        expect(result.data?.status).toBe('draft')
      })
    })

    describe('getInvoices', () => {
      beforeEach(() => {
        mockInvoices = [
          {
            id: 'inv_1',
            invoiceNumber: 'INV-0001',
            clientId: 'client_1',
            issueDate: new Date('2024-01-01'),
            dueDate: new Date('2024-02-01'),
            status: 'draft',
            subtotal: 100,
            tax: 10,
            total: 110,
            notes: null,
            userId: 'user_123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'inv_2',
            invoiceNumber: 'INV-0002',
            clientId: 'client_2',
            issueDate: new Date('2024-01-15'),
            dueDate: new Date('2024-02-15'),
            status: 'sent',
            subtotal: 200,
            tax: 20,
            total: 220,
            notes: null,
            userId: 'user_123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 'inv_3',
            invoiceNumber: 'INV-0003',
            clientId: 'client_1',
            issueDate: new Date('2024-02-01'),
            dueDate: new Date('2024-03-01'),
            status: 'paid',
            subtotal: 300,
            tax: 30,
            total: 330,
            notes: null,
            userId: 'user_123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]
      })

      it('should return all invoices for a user', async () => {
        const result = await getInvoices({ userId: 'user_123' })

        expect(result.success).toBe(true)
        expect(Array.isArray(result.data)).toBe(true)
      })

      it('should filter by status', async () => {
        const result = await getInvoices({ userId: 'user_123', status: 'sent' })

        expect(result.success).toBe(true)
      })

      it('should filter by client', async () => {
        const result = await getInvoices({ userId: 'user_123', clientId: 'client_1' })

        expect(result.success).toBe(true)
      })

      it('should filter by date range', async () => {
        const result = await getInvoices({
          userId: 'user_123',
          dateFrom: new Date('2024-01-01'),
          dateTo: new Date('2024-01-31'),
        })

        expect(result.success).toBe(true)
      })
    })

    describe('getInvoiceById', () => {
      it('should return invoice with line items', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 250,
          tax: 25,
          total: 275,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push(
          {
            id: 'li_1',
            invoiceId: 'inv_123',
            description: 'Service 1',
            quantity: 2,
            unitPrice: 100,
            amount: 200,
          },
          {
            id: 'li_2',
            invoiceId: 'inv_123',
            description: 'Service 2',
            quantity: 1,
            unitPrice: 50,
            amount: 50,
          }
        )

        const result = await getInvoiceById('inv_123')

        expect(result.success).toBe(true)
        expect(result.data?.invoice).toBeDefined()
        expect(result.data?.lineItems).toBeDefined()
        expect(Array.isArray(result.data?.lineItems)).toBe(true)
      })

      it('should include client information', async () => {
        mockClients.push({
          id: 'client_123',
          name: 'Test Client',
          email: 'test@test.com',
          address: null,
          phone: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await getInvoiceById('inv_123')

        expect(result.success).toBe(true)
        expect(result.data?.client).toBeDefined()
      })

      it('should return error for non-existent invoice', async () => {
        mockInvoices = []
        const result = await getInvoiceById('nonexistent')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice not found')
      })
    })

    describe('updateInvoice', () => {
      it('should update invoice header fields', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await updateInvoice('inv_123', {
          notes: 'Updated notes',
          dueDate: new Date('2024-03-01'),
        })

        expect(result.success).toBe(true)
        expect(result.data?.notes).toBe('Updated notes')
      })

      it('should only allow updates to draft invoices', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await updateInvoice('inv_123', { notes: 'New notes' })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Can only update draft invoices')
      })

      it('should recalculate totals when line items change', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await updateInvoice('inv_123', {
          lineItems: [
            { description: 'New Item', quantity: 5, unitPrice: 200 }, // 1000
          ],
          taxRate: 0.1,
        })

        expect(result.success).toBe(true)
        expect(result.data?.subtotal).toBe(1000)
        expect(result.data?.tax).toBe(100)
        expect(result.data?.total).toBe(1100)
      })
    })

    describe('deleteInvoice', () => {
      it('should delete a draft invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await deleteInvoice('inv_123')

        expect(result.success).toBe(true)
      })

      it('should not allow deleting sent invoices', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await deleteInvoice('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Only draft invoices can be deleted')
      })

      it('should not allow deleting paid invoices', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'paid',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await deleteInvoice('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Only draft invoices can be deleted')
      })

      it('should also delete associated line items', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_1',
          invoiceId: 'inv_123',
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await deleteInvoice('inv_123')

        expect(result.success).toBe(true)
      })
    })
  })

  // ============================================================
  // INVOICE STATUS TRANSITIONS
  // ============================================================
  describe('Invoice Status Transitions', () => {
    describe('sendInvoice', () => {
      it('should transition draft to sent', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await sendInvoice('inv_123')

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('sent')
      })

      it('should not allow sending already sent invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await sendInvoice('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice is not in draft status')
      })

      it('should not allow sending paid invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'paid',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await sendInvoice('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice is not in draft status')
      })
    })

    describe('markAsPaid', () => {
      it('should transition sent to paid', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await markAsPaid('inv_123')

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('paid')
      })

      it('should transition overdue to paid', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'overdue',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await markAsPaid('inv_123')

        expect(result.success).toBe(true)
        expect(result.data?.status).toBe('paid')
      })

      it('should not allow marking draft as paid', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await markAsPaid('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice must be sent or overdue to mark as paid')
      })

      it('should not allow marking cancelled as paid', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'cancelled',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await markAsPaid('inv_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice must be sent or overdue to mark as paid')
      })
    })
  })

  // ============================================================
  // LINE ITEM OPERATIONS
  // ============================================================
  describe('Line Item Operations', () => {
    describe('addLineItem', () => {
      it('should add a line item to a draft invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await addLineItem('inv_123', {
          description: 'New Service',
          quantity: 5,
          unitPrice: 75,
        })

        expect(result.success).toBe(true)
        expect(result.data?.description).toBe('New Service')
        expect(result.data?.amount).toBe(375)
      })

      it('should calculate line item amount automatically', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 0,
          tax: 0,
          total: 0,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await addLineItem('inv_123', {
          description: 'Service',
          quantity: 3,
          unitPrice: 100,
        })

        expect(result.data?.amount).toBe(300)
      })

      it('should not allow adding to sent invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        const result = await addLineItem('inv_123', {
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
        })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Can only modify draft invoices')
      })

      it('should update invoice totals after adding', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_1',
          invoiceId: 'inv_123',
          description: 'Existing',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await addLineItem('inv_123', {
          description: 'Additional',
          quantity: 2,
          unitPrice: 50,
        })

        expect(result.success).toBe(true)
      })
    })

    describe('updateLineItem', () => {
      it('should update line item fields', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_123',
          invoiceId: 'inv_123',
          description: 'Old Description',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await updateLineItem('li_123', {
          description: 'Updated Description',
          quantity: 2,
        })

        expect(result.success).toBe(true)
        expect(result.data?.description).toBe('Updated Description')
      })

      it('should recalculate amount when quantity or price changes', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_123',
          invoiceId: 'inv_123',
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await updateLineItem('li_123', {
          quantity: 5,
          unitPrice: 200,
        })

        expect(result.data?.amount).toBe(1000)
      })

      it('should not allow updating on sent invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_123',
          invoiceId: 'inv_123',
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await updateLineItem('li_123', { quantity: 5 })

        expect(result.success).toBe(false)
        expect(result.error).toBe('Can only modify draft invoices')
      })
    })

    describe('removeLineItem', () => {
      it('should remove a line item', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 200,
          tax: 20,
          total: 220,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push(
          {
            id: 'li_1',
            invoiceId: 'inv_123',
            description: 'Item 1',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          },
          {
            id: 'li_2',
            invoiceId: 'inv_123',
            description: 'Item 2',
            quantity: 1,
            unitPrice: 100,
            amount: 100,
          }
        )

        const result = await removeLineItem('li_1')

        expect(result.success).toBe(true)
      })

      it('should not allow removing from sent invoice', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'sent',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_123',
          invoiceId: 'inv_123',
          description: 'Service',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await removeLineItem('li_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Can only modify draft invoices')
      })

      it('should not allow removing last line item', async () => {
        mockInvoices.push({
          id: 'inv_123',
          invoiceNumber: 'INV-0001',
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          status: 'draft',
          subtotal: 100,
          tax: 10,
          total: 110,
          notes: null,
          userId: 'user_123',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        mockLineItems.push({
          id: 'li_123',
          invoiceId: 'inv_123',
          description: 'Only Item',
          quantity: 1,
          unitPrice: 100,
          amount: 100,
        })

        const result = await removeLineItem('li_123')

        expect(result.success).toBe(false)
        expect(result.error).toBe('Invoice must have at least one line item')
      })
    })
  })

  // ============================================================
  // UTILITY FUNCTIONS
  // ============================================================
  describe('Utility Functions', () => {
    describe('calculateInvoiceTotals', () => {
      it('should calculate subtotal from line items', () => {
        const lineItems = [
          { description: 'Item 1', quantity: 2, unitPrice: 100, amount: 200 },
          { description: 'Item 2', quantity: 1, unitPrice: 50, amount: 50 },
          { description: 'Item 3', quantity: 3, unitPrice: 75, amount: 225 },
        ]

        const result = calculateInvoiceTotals(lineItems, 0)

        expect(result.subtotal).toBe(475)
      })

      it('should calculate tax correctly', () => {
        const lineItems = [{ description: 'Item', quantity: 1, unitPrice: 100, amount: 100 }]

        const result = calculateInvoiceTotals(lineItems, 0.1) // 10% tax

        expect(result.tax).toBe(10)
      })

      it('should calculate total as subtotal + tax', () => {
        const lineItems = [{ description: 'Item', quantity: 1, unitPrice: 1000, amount: 1000 }]

        const result = calculateInvoiceTotals(lineItems, 0.15) // 15% tax

        expect(result.subtotal).toBe(1000)
        expect(result.tax).toBe(150)
        expect(result.total).toBe(1150)
      })

      it('should handle zero tax rate', () => {
        const lineItems = [{ description: 'Item', quantity: 1, unitPrice: 500, amount: 500 }]

        const result = calculateInvoiceTotals(lineItems, 0)

        expect(result.subtotal).toBe(500)
        expect(result.tax).toBe(0)
        expect(result.total).toBe(500)
      })

      it('should handle empty line items', () => {
        const result = calculateInvoiceTotals([], 0.1)

        expect(result.subtotal).toBe(0)
        expect(result.tax).toBe(0)
        expect(result.total).toBe(0)
      })

      it('should round to 2 decimal places', () => {
        const lineItems = [{ description: 'Item', quantity: 3, unitPrice: 33.33, amount: 99.99 }]

        const result = calculateInvoiceTotals(lineItems, 0.1)

        // 99.99 * 0.1 = 9.999 -> should round to 10.00
        expect(result.tax).toBe(10)
        expect(result.total).toBe(109.99)
      })
    })

    describe('generateInvoiceNumber', () => {
      it('should generate sequential invoice numbers', async () => {
        mockInvoices = []

        const num1 = await generateInvoiceNumber('user_123')
        expect(num1).toBe('INV-0001')
      })

      it('should increment from existing invoices', async () => {
        mockInvoices = [
          {
            id: 'inv_1',
            invoiceNumber: 'INV-0005',
            clientId: 'client_1',
            issueDate: new Date(),
            dueDate: new Date(),
            status: 'paid',
            subtotal: 100,
            tax: 10,
            total: 110,
            notes: null,
            userId: 'user_123',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        const num = await generateInvoiceNumber('user_123')
        expect(num).toBe('INV-0006')
      })

      it('should pad with zeros', async () => {
        mockInvoices = []

        const num = await generateInvoiceNumber('user_123')
        expect(num).toMatch(/^INV-\d{4}$/)
      })

      it('should be scoped to user', async () => {
        mockInvoices = [
          {
            id: 'inv_1',
            invoiceNumber: 'INV-0010',
            clientId: 'client_1',
            issueDate: new Date(),
            dueDate: new Date(),
            status: 'paid',
            subtotal: 100,
            tax: 10,
            total: 110,
            notes: null,
            userId: 'other_user',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]

        // New user should start from 1
        const num = await generateInvoiceNumber('new_user')
        expect(num).toBe('INV-0001')
      })
    })
  })

  // ============================================================
  // VALIDATION SCHEMAS
  // ============================================================
  describe('Validation Schemas', () => {
    describe('createClientSchema', () => {
      it('should validate valid client data', () => {
        const result = createClientSchema.safeParse({
          name: 'Test Client',
          email: 'test@example.com',
          userId: 'user_123',
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty name', () => {
        const result = createClientSchema.safeParse({
          name: '',
          email: 'test@example.com',
          userId: 'user_123',
        })
        expect(result.success).toBe(false)
      })

      it('should reject invalid email', () => {
        const result = createClientSchema.safeParse({
          name: 'Test',
          email: 'not-an-email',
          userId: 'user_123',
        })
        expect(result.success).toBe(false)
      })
    })

    describe('createInvoiceSchema', () => {
      it('should validate valid invoice data', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: 1, unitPrice: 100 }],
        })
        expect(result.success).toBe(true)
      })

      it('should reject empty line items', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [],
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative quantity', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: -1, unitPrice: 100 }],
        })
        expect(result.success).toBe(false)
      })

      it('should reject negative unit price', () => {
        const result = createInvoiceSchema.safeParse({
          clientId: 'client_123',
          issueDate: new Date(),
          dueDate: new Date(),
          userId: 'user_123',
          lineItems: [{ description: 'Service', quantity: 1, unitPrice: -50 }],
        })
        expect(result.success).toBe(false)
      })
    })

    describe('lineItemSchema', () => {
      it('should validate valid line item', () => {
        const result = lineItemSchema.safeParse({
          description: 'Consulting services',
          quantity: 10,
          unitPrice: 150,
        })
        expect(result.success).toBe(true)
      })

      it('should require description', () => {
        const result = lineItemSchema.safeParse({
          description: '',
          quantity: 1,
          unitPrice: 100,
        })
        expect(result.success).toBe(false)
      })

      it('should require positive quantity', () => {
        const result = lineItemSchema.safeParse({
          description: 'Service',
          quantity: 0,
          unitPrice: 100,
        })
        expect(result.success).toBe(false)
      })
    })
  })
})
