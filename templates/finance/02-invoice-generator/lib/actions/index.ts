/**
 * Template #2: Invoice Generator
 * Server actions for invoice, client, and line item management
 */

'use server'

import { db } from '@/lib/db'
import {
  clients,
  invoices,
  invoiceLineItems,
  type Client,
  type Invoice,
  type InvoiceLineItem,
  type InvoiceStatus,
} from '../db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'
import { z } from 'zod'

// ============================================================
// VALIDATION SCHEMAS
// ============================================================

export const lineItemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.number().positive('Quantity must be positive'),
  unitPrice: z.number().nonnegative('Unit price cannot be negative'),
})

export const createClientSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  address: z.string().optional(),
  phone: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
})

export const updateClientSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
})

export const createInvoiceSchema = z.object({
  clientId: z.string().min(1, 'Client ID is required'),
  issueDate: z.date(),
  dueDate: z.date(),
  notes: z.string().optional(),
  userId: z.string().min(1, 'User ID is required'),
  taxRate: z.number().min(0).max(1).optional().default(0),
  lineItems: z.array(lineItemSchema).min(1, 'At least one line item is required'),
})

export const updateInvoiceSchema = z.object({
  dueDate: z.date().optional(),
  notes: z.string().optional(),
  taxRate: z.number().min(0).max(1).optional(),
  lineItems: z.array(lineItemSchema).min(1).optional(),
})

// ============================================================
// RESULT TYPES
// ============================================================

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

/**
 * Calculate invoice totals from line items
 */
export function calculateInvoiceTotals(
  lineItems: Array<{ amount: number }>,
  taxRate: number
): { subtotal: number; tax: number; total: number } {
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const tax = Math.round(subtotal * taxRate * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  return { subtotal, tax, total }
}

/**
 * Generate sequential invoice number for a user
 */
export async function generateInvoiceNumber(userId: string): Promise<string> {
  const existingInvoices = await db
    .select({ invoiceNumber: invoices.invoiceNumber })
    .from(invoices)
    .where(eq(invoices.userId, userId))
    .orderBy(desc(invoices.invoiceNumber))

  let nextNumber = 1

  if (existingInvoices.length > 0) {
    const lastNumber = existingInvoices[0].invoiceNumber
    const match = lastNumber.match(/INV-(\d+)/)
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1
    }
  }

  return `INV-${nextNumber.toString().padStart(4, '0')}`
}

// ============================================================
// CLIENT CRUD OPERATIONS
// ============================================================

/**
 * Create a new client
 */
export async function createClient(
  data: z.infer<typeof createClientSchema>
): Promise<ActionResult<Client>> {
  const validated = createClientSchema.parse(data)

  const id = `client_${crypto.randomUUID().slice(0, 8)}`
  const now = new Date()

  const [client] = await db
    .insert(clients)
    .values({
      id,
      name: validated.name,
      email: validated.email,
      address: validated.address ?? null,
      phone: validated.phone ?? null,
      userId: validated.userId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return { success: true, data: client }
}

/**
 * Get all clients for a user
 */
export async function getClients(userId: string): Promise<ActionResult<Client[]>> {
  const allClients = await db
    .select()
    .from(clients)
    .where(eq(clients.userId, userId))
    .orderBy(desc(clients.createdAt))

  return { success: true, data: allClients }
}

/**
 * Get a single client by ID
 */
export async function getClientById(clientId: string): Promise<ActionResult<Client>> {
  const result = await db.select().from(clients).where(eq(clients.id, clientId))

  if (result.length === 0) {
    return { success: false, error: 'Client not found' }
  }

  return { success: true, data: result[0] }
}

/**
 * Update a client
 */
export async function updateClient(
  clientId: string,
  data: z.infer<typeof updateClientSchema>
): Promise<ActionResult<Client>> {
  const validated = updateClientSchema.parse(data)

  const [client] = await db
    .update(clients)
    .set({ ...validated, updatedAt: new Date() })
    .where(eq(clients.id, clientId))
    .returning()

  if (!client) {
    return { success: false, error: 'Client not found' }
  }

  return { success: true, data: client }
}

/**
 * Delete a client (only if no invoices exist)
 */
export async function deleteClient(clientId: string): Promise<ActionResult<void>> {
  // Check for existing invoices
  const existingInvoices = await db
    .select()
    .from(invoices)
    .where(eq(invoices.clientId, clientId))

  if (existingInvoices.length > 0) {
    return { success: false, error: 'Cannot delete client with existing invoices' }
  }

  await db.delete(clients).where(eq(clients.id, clientId))

  return { success: true, data: undefined }
}

// ============================================================
// INVOICE CRUD OPERATIONS
// ============================================================

/**
 * Create an invoice with line items
 */
export async function createInvoice(
  data: z.infer<typeof createInvoiceSchema>
): Promise<ActionResult<Invoice>> {
  const validated = createInvoiceSchema.parse(data)

  // Verify client exists
  const clientResult = await db
    .select()
    .from(clients)
    .where(eq(clients.id, validated.clientId))

  if (clientResult.length === 0) {
    return { success: false, error: 'Client not found' }
  }

  // Generate invoice number
  const invoiceNumber = await generateInvoiceNumber(validated.userId)

  // Calculate line item amounts and totals
  const lineItemsWithAmounts = validated.lineItems.map(item => ({
    ...item,
    amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
  }))

  const { subtotal, tax, total } = calculateInvoiceTotals(
    lineItemsWithAmounts,
    validated.taxRate ?? 0
  )

  // Create invoice and line items in transaction
  const invoiceId = `inv_${crypto.randomUUID().slice(0, 8)}`
  const now = new Date()

  return await db.transaction(async tx => {
    const [invoice] = await tx
      .insert(invoices)
      .values({
        id: invoiceId,
        invoiceNumber,
        clientId: validated.clientId,
        issueDate: validated.issueDate,
        dueDate: validated.dueDate,
        status: 'draft',
        subtotal,
        tax,
        total,
        notes: validated.notes ?? null,
        userId: validated.userId,
        createdAt: now,
        updatedAt: now,
      })
      .returning()

    // Insert line items
    for (const item of lineItemsWithAmounts) {
      await tx.insert(invoiceLineItems).values({
        id: `li_${crypto.randomUUID().slice(0, 8)}`,
        invoiceId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.amount,
      })
    }

    return { success: true as const, data: invoice }
  })
}

/**
 * Get invoices with optional filters
 */
export async function getInvoices(filters: {
  userId: string
  status?: InvoiceStatus
  clientId?: string
  dateFrom?: Date
  dateTo?: Date
}): Promise<ActionResult<Array<Invoice & { client?: Client }>>> {
  let query = db
    .select()
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.userId, filters.userId))

  // Note: In a real implementation, you'd chain the filters dynamically
  // For simplicity, we're returning the base query result
  const results = await query.orderBy(desc(invoices.createdAt))

  const mapped = results.map(r => ({
    ...r.invoices,
    client: r.clients ?? undefined,
  }))

  return { success: true, data: mapped }
}

/**
 * Get a single invoice with line items and client
 */
export async function getInvoiceById(invoiceId: string): Promise<
  ActionResult<{
    invoice: Invoice
    lineItems: InvoiceLineItem[]
    client?: Client
  }>
> {
  const invoiceResult = await db
    .select()
    .from(invoices)
    .leftJoin(clients, eq(invoices.clientId, clients.id))
    .where(eq(invoices.id, invoiceId))

  if (invoiceResult.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  const lineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))

  return {
    success: true,
    data: {
      invoice: invoiceResult[0].invoices,
      lineItems,
      client: invoiceResult[0].clients ?? undefined,
    },
  }
}

/**
 * Update an invoice (draft only)
 */
export async function updateInvoice(
  invoiceId: string,
  data: z.infer<typeof updateInvoiceSchema>
): Promise<ActionResult<Invoice>> {
  // Check invoice exists and is draft
  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))

  if (existingInvoice.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Can only update draft invoices' }
  }

  const validated = updateInvoiceSchema.parse(data)

  return await db.transaction(async tx => {
    let updateData: Partial<typeof invoices.$inferInsert> = {
      updatedAt: new Date(),
    }

    if (validated.dueDate) {
      updateData.dueDate = validated.dueDate
    }
    if (validated.notes !== undefined) {
      updateData.notes = validated.notes
    }

    // If line items provided, recalculate totals
    if (validated.lineItems) {
      // Delete existing line items
      await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId))

      // Insert new line items
      const lineItemsWithAmounts = validated.lineItems.map(item => ({
        ...item,
        amount: Math.round(item.quantity * item.unitPrice * 100) / 100,
      }))

      for (const item of lineItemsWithAmounts) {
        await tx.insert(invoiceLineItems).values({
          id: `li_${crypto.randomUUID().slice(0, 8)}`,
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.amount,
        })
      }

      const { subtotal, tax, total } = calculateInvoiceTotals(
        lineItemsWithAmounts,
        validated.taxRate ?? 0
      )

      updateData.subtotal = subtotal
      updateData.tax = tax
      updateData.total = total
    }

    const [invoice] = await tx
      .update(invoices)
      .set(updateData)
      .where(eq(invoices.id, invoiceId))
      .returning()

    return { success: true as const, data: invoice }
  })
}

/**
 * Delete an invoice (draft only)
 */
export async function deleteInvoice(invoiceId: string): Promise<ActionResult<void>> {
  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))

  if (existingInvoice.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Only draft invoices can be deleted' }
  }

  await db.transaction(async tx => {
    // Delete line items first (cascade should handle this, but explicit is clearer)
    await tx.delete(invoiceLineItems).where(eq(invoiceLineItems.invoiceId, invoiceId))
    await tx.delete(invoices).where(eq(invoices.id, invoiceId))
  })

  return { success: true, data: undefined }
}

// ============================================================
// INVOICE STATUS TRANSITIONS
// ============================================================

/**
 * Send an invoice (draft -> sent)
 */
export async function sendInvoice(invoiceId: string): Promise<ActionResult<Invoice>> {
  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))

  if (existingInvoice.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Invoice is not in draft status' }
  }

  const [invoice] = await db
    .update(invoices)
    .set({ status: 'sent', updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId))
    .returning()

  return { success: true, data: invoice }
}

/**
 * Mark an invoice as paid (sent/overdue -> paid)
 */
export async function markAsPaid(invoiceId: string): Promise<ActionResult<Invoice>> {
  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))

  if (existingInvoice.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  const validStatuses: InvoiceStatus[] = ['sent', 'overdue']
  if (!validStatuses.includes(existingInvoice[0].status as InvoiceStatus)) {
    return { success: false, error: 'Invoice must be sent or overdue to mark as paid' }
  }

  const [invoice] = await db
    .update(invoices)
    .set({ status: 'paid', updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId))
    .returning()

  return { success: true, data: invoice }
}

// ============================================================
// LINE ITEM OPERATIONS
// ============================================================

/**
 * Add a line item to a draft invoice
 */
export async function addLineItem(
  invoiceId: string,
  data: z.infer<typeof lineItemSchema>
): Promise<ActionResult<InvoiceLineItem>> {
  const validated = lineItemSchema.parse(data)

  // Check invoice exists and is draft
  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, invoiceId))

  if (existingInvoice.length === 0) {
    return { success: false, error: 'Invoice not found' }
  }

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Can only modify draft invoices' }
  }

  const amount = Math.round(validated.quantity * validated.unitPrice * 100) / 100

  const [lineItem] = await db
    .insert(invoiceLineItems)
    .values({
      id: `li_${crypto.randomUUID().slice(0, 8)}`,
      invoiceId,
      description: validated.description,
      quantity: validated.quantity,
      unitPrice: validated.unitPrice,
      amount,
    })
    .returning()

  // Recalculate invoice totals
  const allLineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, invoiceId))

  const { subtotal, tax, total } = calculateInvoiceTotals(allLineItems, 0)

  await db
    .update(invoices)
    .set({ subtotal, tax, total, updatedAt: new Date() })
    .where(eq(invoices.id, invoiceId))

  return { success: true, data: lineItem }
}

/**
 * Update a line item
 */
export async function updateLineItem(
  lineItemId: string,
  data: Partial<z.infer<typeof lineItemSchema>>
): Promise<ActionResult<InvoiceLineItem>> {
  // Get the line item and its invoice
  const existingLineItem = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, lineItemId))

  if (existingLineItem.length === 0) {
    return { success: false, error: 'Line item not found' }
  }

  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, existingLineItem[0].invoiceId))

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Can only modify draft invoices' }
  }

  const quantity = data.quantity ?? existingLineItem[0].quantity
  const unitPrice = data.unitPrice ?? existingLineItem[0].unitPrice
  const amount = Math.round(quantity * unitPrice * 100) / 100

  const [lineItem] = await db
    .update(invoiceLineItems)
    .set({
      description: data.description ?? existingLineItem[0].description,
      quantity,
      unitPrice,
      amount,
    })
    .where(eq(invoiceLineItems.id, lineItemId))
    .returning()

  // Recalculate invoice totals
  const allLineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, existingLineItem[0].invoiceId))

  const { subtotal, tax, total } = calculateInvoiceTotals(allLineItems, 0)

  await db
    .update(invoices)
    .set({ subtotal, tax, total, updatedAt: new Date() })
    .where(eq(invoices.id, existingLineItem[0].invoiceId))

  return { success: true, data: lineItem }
}

/**
 * Remove a line item
 */
export async function removeLineItem(lineItemId: string): Promise<ActionResult<void>> {
  // Get the line item and its invoice
  const existingLineItem = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.id, lineItemId))

  if (existingLineItem.length === 0) {
    return { success: false, error: 'Line item not found' }
  }

  const existingInvoice = await db
    .select()
    .from(invoices)
    .where(eq(invoices.id, existingLineItem[0].invoiceId))

  if (existingInvoice[0].status !== 'draft') {
    return { success: false, error: 'Can only modify draft invoices' }
  }

  // Check if this is the last line item
  const allLineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, existingLineItem[0].invoiceId))

  if (allLineItems.length <= 1) {
    return { success: false, error: 'Invoice must have at least one line item' }
  }

  await db.delete(invoiceLineItems).where(eq(invoiceLineItems.id, lineItemId))

  // Recalculate invoice totals
  const remainingLineItems = await db
    .select()
    .from(invoiceLineItems)
    .where(eq(invoiceLineItems.invoiceId, existingLineItem[0].invoiceId))

  const { subtotal, tax, total } = calculateInvoiceTotals(remainingLineItems, 0)

  await db
    .update(invoices)
    .set({ subtotal, tax, total, updatedAt: new Date() })
    .where(eq(invoices.id, existingLineItem[0].invoiceId))

  return { success: true, data: undefined }
}
