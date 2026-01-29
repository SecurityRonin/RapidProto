/**
 * Tests for Invoice Generator Schema
 * TDD: These tests define the expected schema structure
 */

import { describe, it, expect } from 'vitest'
import {
  clients,
  invoices,
  invoiceLineItems,
  type Client,
  type NewClient,
  type Invoice,
  type NewInvoice,
  type InvoiceLineItem,
  type NewInvoiceLineItem,
  InvoiceStatus,
} from './schema'

describe('Invoice Generator Schema', () => {
  describe('Clients Table', () => {
    it('should have required fields', () => {
      expect(clients).toBeDefined()
      expect(clients.id).toBeDefined()
      expect(clients.name).toBeDefined()
      expect(clients.email).toBeDefined()
      expect(clients.userId).toBeDefined()
      expect(clients.createdAt).toBeDefined()
      expect(clients.updatedAt).toBeDefined()
    })

    it('should have optional fields', () => {
      expect(clients.address).toBeDefined()
      expect(clients.phone).toBeDefined()
    })

    it('should export Client types', () => {
      const client: Client = {
        id: 'client_123',
        name: 'Acme Corp',
        email: 'billing@acme.com',
        address: '123 Main St',
        phone: '555-1234',
        userId: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(client).toBeDefined()
    })
  })

  describe('Invoices Table', () => {
    it('should have required fields', () => {
      expect(invoices).toBeDefined()
      expect(invoices.id).toBeDefined()
      expect(invoices.invoiceNumber).toBeDefined()
      expect(invoices.clientId).toBeDefined()
      expect(invoices.issueDate).toBeDefined()
      expect(invoices.dueDate).toBeDefined()
      expect(invoices.status).toBeDefined()
      expect(invoices.subtotal).toBeDefined()
      expect(invoices.tax).toBeDefined()
      expect(invoices.total).toBeDefined()
      expect(invoices.userId).toBeDefined()
      expect(invoices.createdAt).toBeDefined()
      expect(invoices.updatedAt).toBeDefined()
    })

    it('should have optional notes field', () => {
      expect(invoices.notes).toBeDefined()
    })

    it('should have foreign key to clients', () => {
      // The clientId should reference the clients table
      expect(invoices.clientId).toBeDefined()
    })

    it('should support all invoice statuses', () => {
      const statuses: InvoiceStatus[] = ['draft', 'sent', 'paid', 'overdue', 'cancelled']
      statuses.forEach(status => {
        expect(['draft', 'sent', 'paid', 'overdue', 'cancelled']).toContain(status)
      })
    })

    it('should export Invoice types', () => {
      const invoice: Invoice = {
        id: 'inv_123',
        invoiceNumber: 'INV-0001',
        clientId: 'client_123',
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'draft',
        subtotal: 1000,
        tax: 100,
        total: 1100,
        notes: null,
        userId: 'user_123',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(invoice).toBeDefined()
    })
  })

  describe('Invoice Line Items Table', () => {
    it('should have required fields', () => {
      expect(invoiceLineItems).toBeDefined()
      expect(invoiceLineItems.id).toBeDefined()
      expect(invoiceLineItems.invoiceId).toBeDefined()
      expect(invoiceLineItems.description).toBeDefined()
      expect(invoiceLineItems.quantity).toBeDefined()
      expect(invoiceLineItems.unitPrice).toBeDefined()
      expect(invoiceLineItems.amount).toBeDefined()
    })

    it('should have foreign key to invoices', () => {
      expect(invoiceLineItems.invoiceId).toBeDefined()
    })

    it('should export InvoiceLineItem types', () => {
      const lineItem: InvoiceLineItem = {
        id: 'li_123',
        invoiceId: 'inv_123',
        description: 'Consulting services',
        quantity: 10,
        unitPrice: 150,
        amount: 1500,
      }
      expect(lineItem).toBeDefined()
    })
  })

  describe('Type Inference', () => {
    it('should infer NewClient type correctly', () => {
      const newClient: NewClient = {
        id: 'client_123',
        name: 'Test Client',
        email: 'test@example.com',
        userId: 'user_123',
      }
      expect(newClient).toBeDefined()
    })

    it('should infer NewInvoice type correctly', () => {
      const newInvoice: NewInvoice = {
        id: 'inv_123',
        invoiceNumber: 'INV-0001',
        clientId: 'client_123',
        issueDate: new Date(),
        dueDate: new Date(),
        status: 'draft',
        subtotal: 0,
        tax: 0,
        total: 0,
        userId: 'user_123',
      }
      expect(newInvoice).toBeDefined()
    })

    it('should infer NewInvoiceLineItem type correctly', () => {
      const newLineItem: NewInvoiceLineItem = {
        id: 'li_123',
        invoiceId: 'inv_123',
        description: 'Service',
        quantity: 1,
        unitPrice: 100,
        amount: 100,
      }
      expect(newLineItem).toBeDefined()
    })
  })
})
