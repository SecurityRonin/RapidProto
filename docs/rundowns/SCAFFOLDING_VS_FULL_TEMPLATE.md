# Scaffolding vs Full Template: The Difference

**Last Updated:** 2026-01-24

---

## Overview

We have **75 templates** in three states:
1. **✅ Full Production (1 template):** Template #16 - Complete with TDD
2. **🏗️ Production-Quality Scaffolding (74 templates):** Structure ready for implementation
3. **🎯 Ready for Implementation:** Top 10 priority templates identified

---

## Side-by-Side Comparison

### Template #2: Invoice Generator (Scaffolded)

**What you get:**
```
template-2-invoice-generator/
├── lib/
│   ├── db/
│   │   ├── schema.ts              ← STUB (20 lines, generic example)
│   │   └── schema.test.ts         ← STUB (basic structure tests)
│   ├── actions/
│   │   ├── index.ts               ← STUB (generic CRUD, 60 lines)
│   │   └── index.test.ts          ← STUB (5-6 test cases outlined)
│   └── utils/                     ← Empty
├── components/                     ← Empty
├── README.md                       ← Generic setup guide
├── package.json                    ← Configured
└── Makefile                        ← Dev commands

Files: 4 TypeScript files
Lines of code: ~100 lines
Tests: 5-6 test stubs
Status: READY FOR IMPLEMENTATION
```

**Schema example (stub):**
```typescript
// TODO: Define your database tables here
export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  // ... generic fields
})
```

**Actions example (stub):**
```typescript
// Generic CRUD operations
export async function createItem(data) { ... }
export async function getItems() { ... }
export async function getItem(id) { ... }
// No business logic, no validation complexity
```

---

### Template #16: Client Intake (Full Production)

**What you get:**
```
template-16-client-intake/
├── lib/
│   ├── db/
│   │   ├── schema.ts              ← FULL (6 tables, 180+ lines)
│   │   └── schema.test.ts         ← FULL (comprehensive tests)
│   ├── actions/
│   │   ├── clients.ts             ← FULL (500+ lines, complex logic)
│   │   ├── clients.test.ts        ← FULL (15+ test cases)
│   │   ├── intake.ts              ← FULL (form submission logic)
│   │   ├── admin.ts               ← FULL (approval workflow)
│   │   └── admin.test.ts          ← FULL (workflow tests)
│   ├── ai/
│   │   ├── document-extraction.ts ← AI features implemented
│   │   └── document-extraction.test.ts
│   └── email.ts                   ← Email automation
├── components/
│   ├── intake-form.tsx            ← Full UI component
│   ├── intake-form.test.tsx       ← Component tests
│   ├── admin-dashboard.tsx        ← Admin UI
│   └── admin-dashboard.test.tsx   ← Dashboard tests
├── README.md                       ← Detailed setup & API reference
├── DEMO_SCRIPT.md                  ← 50-minute demo guide
├── IMPLEMENTATION_SUMMARY.md       ← Technical deep dive
├── package.json                    ← Fully configured
└── Makefile                        ← All commands working

Files: 13+ TypeScript files
Lines of code: 2,000+ lines
Tests: 45 passing tests
Status: PRODUCTION-READY ✅
```

**Schema example (full):**
```typescript
// 6 interconnected tables
export const clients = sqliteTable('clients', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type', { enum: ['individual', 'business'] }).notNull(),
  email: text('email').notNull(),
  status: text('status', {
    enum: ['prospect', 'active', 'inactive', 'conflict'],
  }).notNull().default('prospect'),
  // ... 10+ specific fields with business rules
})

export const intakeForms = sqliteTable(...)
export const intakeSubmissions = sqliteTable(...)
export const conflictChecks = sqliteTable(...)
export const onboardingTasks = sqliteTable(...)
export const documents = sqliteTable(...)
```

**Actions example (full):**
```typescript
// Complex business logic with authentication
export async function createClient(input) {
  const { userId } = auth()
  if (!userId) return { success: false, error: 'Unauthorized' }

  const validated = createClientSchema.parse(input)

  // Create client
  const [client] = await db.insert(clients).values({
    id: nanoid(),
    ...validated,
    createdBy: userId,
  }).returning()

  // Auto conflict check if requested
  if (input.autoConflictCheck) {
    await runConflictCheck({ clientId: client.id })
  }

  // Send notifications
  await sendEmail({
    to: client.email,
    subject: 'Welcome',
    // ... email template
  })

  return { success: true, data: client }
}
```

---

## The Gap: What Needs to Be Added

To go from **scaffolding → full template**, you need to implement:

### 1. Database Schema (15-20 min)
**Scaffolding provides:**
- Basic table structure
- Generic fields (id, name, status, timestamps)

**You add:**
- Domain-specific tables (invoices, line items, payments, etc.)
- Proper relationships (foreign keys, cascades)
- Business-specific fields (tax rates, payment terms, due dates)
- Enums for status workflows
- JSON fields for complex data

**Example for Invoice Generator:**
```typescript
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  invoiceNumber: text('invoice_number').notNull().unique(),
  clientId: text('client_id').notNull().references(() => clients.id),
  issueDate: integer('issue_date', { mode: 'timestamp' }).notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  subtotal: real('subtotal').notNull(),
  taxRate: real('tax_rate').notNull(),
  taxAmount: real('tax_amount').notNull(),
  total: real('total').notNull(),
  status: text('status', {
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled']
  }).notNull(),
  // ... more invoice-specific fields
})

export const lineItems = sqliteTable('line_items', {
  id: text('id').primaryKey(),
  invoiceId: text('invoice_id').notNull().references(() => invoices.id),
  description: text('description').notNull(),
  quantity: real('quantity').notNull(),
  unitPrice: real('unit_price').notNull(),
  amount: real('amount').notNull(),
})

export const payments = sqliteTable('payments', {
  // ... payment tracking
})
```

---

### 2. Server Actions (30-45 min)
**Scaffolding provides:**
- Basic CRUD (Create, Read, Update, Delete)
- Zod validation structure
- Error handling pattern

**You add:**
- Business logic (calculate totals, tax, discounts)
- Complex validation (date ranges, credit limits)
- Workflow state transitions (draft → sent → paid)
- Related operations (create invoice + line items in transaction)
- Authorization checks (user permissions)
- Notifications (send invoice via email)

**Example for Invoice Generator:**
```typescript
export async function createInvoice(input: InvoiceInput) {
  const validated = invoiceSchema.parse(input)

  // Calculate totals
  const subtotal = validated.lineItems.reduce(
    (sum, item) => sum + (item.quantity * item.unitPrice), 0
  )
  const taxAmount = subtotal * validated.taxRate
  const total = subtotal + taxAmount

  // Create invoice + line items in transaction
  const invoice = await db.transaction(async (tx) => {
    const [inv] = await tx.insert(invoices).values({
      id: nanoid(),
      invoiceNumber: await generateInvoiceNumber(),
      ...validated,
      subtotal,
      taxAmount,
      total,
      status: 'draft',
    }).returning()

    await tx.insert(lineItems).values(
      validated.lineItems.map(item => ({
        id: nanoid(),
        invoiceId: inv.id,
        ...item,
        amount: item.quantity * item.unitPrice,
      }))
    )

    return inv
  })

  return { success: true, data: invoice }
}

export async function sendInvoice(invoiceId: string) {
  // Get invoice + client
  // Generate PDF
  // Send email
  // Update status to 'sent'
  // Record sent date
}

export async function recordPayment(invoiceId: string, amount: number) {
  // Validate payment
  // Update invoice status
  // Create payment record
  // Send receipt email
}
```

---

### 3. Tests (20-30 min)
**Scaffolding provides:**
- Test file structure
- Basic test cases outlined
- Mock setup

**You add:**
- Comprehensive test coverage
- Edge cases
- Error scenarios
- Integration tests
- Mock complex dependencies

**Example for Invoice Generator:**
```typescript
describe('Invoice Actions', () => {
  describe('createInvoice', () => {
    it('should calculate totals correctly', async () => {
      const result = await createInvoice({
        clientId: 'client_123',
        lineItems: [
          { description: 'Service A', quantity: 2, unitPrice: 100 },
          { description: 'Service B', quantity: 1, unitPrice: 50 },
        ],
        taxRate: 0.08, // 8% tax
      })

      expect(result.data.subtotal).toBe(250) // 2*100 + 1*50
      expect(result.data.taxAmount).toBe(20) // 250 * 0.08
      expect(result.data.total).toBe(270)
    })

    it('should generate unique invoice numbers', async () => { ... })
    it('should handle zero-tax invoices', async () => { ... })
    it('should validate negative quantities', async () => { ... })
  })

  describe('sendInvoice', () => {
    it('should send email and update status', async () => { ... })
    it('should generate PDF attachment', async () => { ... })
    it('should fail if invoice not found', async () => { ... })
  })

  describe('recordPayment', () => {
    it('should mark invoice as paid when full payment received', async () => { ... })
    it('should allow partial payments', async () => { ... })
    it('should prevent overpayment', async () => { ... })
  })
})
```

---

### 4. UI Components (30-60 min)
**Scaffolding provides:**
- Empty components directory
- No UI code

**You add:**
- Form components (invoice creation, line item editor)
- List/table views (invoice list with filtering)
- Detail views (invoice preview)
- Interactive features (add/remove line items, auto-calculate)
- Loading states, error handling
- Responsive design with Tailwind
- shadcn/ui component integration

**Example for Invoice Generator:**
```typescript
// components/invoice-form.tsx
export function InvoiceForm() {
  const [lineItems, setLineItems] = useState([...])
  const subtotal = calculateSubtotal(lineItems)
  const taxAmount = subtotal * taxRate
  const total = subtotal + taxAmount

  return (
    <form onSubmit={handleSubmit}>
      <ClientSelector />
      <DatePicker label="Issue Date" />
      <DatePicker label="Due Date" />

      <LineItemEditor
        items={lineItems}
        onAdd={addLineItem}
        onRemove={removeLineItem}
      />

      <div className="totals">
        <div>Subtotal: ${subtotal}</div>
        <div>Tax ({taxRate * 100}%): ${taxAmount}</div>
        <div>Total: ${total}</div>
      </div>

      <Button type="submit">Create Invoice</Button>
    </form>
  )
}

// components/invoice-list.tsx
export function InvoiceList() {
  // Table with filtering, sorting, status badges
}

// components/invoice-preview.tsx
export function InvoicePreview({ id }) {
  // PDF-like preview, print button, send button
}
```

---

### 5. AI Features (20-30 min, optional)
**Scaffolding provides:**
- Nothing

**You add:**
- AI-powered features specific to template
- Document extraction
- Smart suggestions
- Auto-categorization

**Example for Invoice Generator:**
```typescript
// lib/ai/invoice-extraction.ts
export async function extractInvoiceFromImage(imageUrl: string) {
  const result = await ai.generateObject({
    model: 'gpt-4-vision',
    schema: z.object({
      invoiceNumber: z.string().optional(),
      date: z.string().optional(),
      lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
      })),
      total: z.number().optional(),
    }),
    prompt: 'Extract invoice details from this image...',
  })

  return result.object
}

// lib/ai/client-matching.ts
export async function suggestClientFromInvoice(data) {
  // Use AI to match extracted invoice to existing clients
}
```

---

### 6. Documentation (15 min)
**Scaffolding provides:**
- Generic README template
- Basic setup instructions

**You add:**
- Specific setup steps
- Customization examples
- API documentation
- Demo script (50-minute format)
- Screenshots/examples

---

## Time Breakdown

| Task | Scaffolded | Full Template | Time to Implement |
|------|-----------|---------------|-------------------|
| **Schema** | Generic stub | Domain-specific tables | 15-20 min |
| **Actions** | Basic CRUD | Business logic | 30-45 min |
| **Tests** | 5-6 stubs | 30-50 comprehensive | 20-30 min |
| **UI** | Nothing | Full components | 30-60 min |
| **AI** | Nothing | Smart features | 20-30 min |
| **Docs** | Generic | Detailed + demo | 15 min |
| **E2E Testing** | Nothing | Full flow validation | 10 min |
| **TOTAL** | ~10 min to generate | Production-ready | **2.5-4 hours** |

---

## What Scaffolding Gives You

✅ **Project structure** - No setup time wasted
✅ **TypeScript configured** - Proper types from day one
✅ **Database setup** - Drizzle ORM ready
✅ **Testing framework** - Vitest configured
✅ **Build tools** - Makefile with dev commands
✅ **Best practices** - TDD structure, Zod validation, proper error handling
✅ **Consistency** - All 75 templates follow same patterns

---

## What You Still Need to Do

📝 **Domain expertise** - Understand the business problem
🎨 **UI/UX design** - Create user-friendly interfaces
🧠 **Business logic** - Implement specific workflows
✅ **Test coverage** - Write comprehensive tests
🤖 **AI features** - Add intelligence where valuable
📖 **Documentation** - Explain how to use and customize

---

## The RapidProto Advantage

### Traditional Approach:
```
Start from scratch → 6-8 hours to production-ready template
```

### With Scaffolding:
```
Scaffolded template (10 min) → 2.5-4 hours to production-ready
Saves: 50-60% of development time
```

### Even Better with Reference Templates:
```
Copy from Template #16 patterns → Follow proven TDD approach → High confidence
```

---

## Conclusion

**Scaffolding ≠ Production Template**

**Scaffolding =** Structure + patterns + boilerplate
**Full Template =** Scaffolding + domain logic + UI + tests + AI + docs

**The gap:** 2.5-4 hours of focused implementation work

**What we've done:** Built scaffolding for 74 templates (saves 200+ hours of setup time)

**What's next:** Implement top 10 priority templates with full TDD (30-40 hours total)

---

**The beauty:** You can implement templates on-demand based on customer needs, knowing the structure is already in place and battle-tested.
