# TDD Guide: 50-Minute MVP Template

## Philosophy: Why TDD for Rapid MVPs?

**Common Misconception:** "Tests slow me down during rapid prototyping"

**Reality:** TDD actually SPEEDS UP 30-minute builds because:

1. **Fewer bugs** - Catch issues immediately, not during demo
2. **Faster debugging** - Know exactly what broke when tests fail
3. **Confident refactoring** - Improve code without fear
4. **Better design** - Testable code is cleaner code
5. **Living documentation** - Tests show how code should work

## The Red-Green-Refactor Loop

```
🔴 RED: Write a failing test
   ↓
🟢 GREEN: Make it pass (minimal code)
   ↓
✨ REFACTOR: Improve code (tests still pass)
   ↓
🔄 REPEAT
```

### Example: Adding Task Priority

**🔴 RED: Write failing test**

```typescript
// lib/actions/__tests__/items.test.ts

describe('Task priority', () => {
  it('should create task with priority', async () => {
    const result = await createItem({
      title: 'Important Task',
      priority: 'high',
    })

    expect(result.success).toBe(true)
    expect(result.data?.priority).toBe('high')
  })

  it('should default to medium priority', async () => {
    const result = await createItem({
      title: 'Normal Task',
    })

    expect(result.data?.priority).toBe('medium')
  })

  it('should validate priority enum', async () => {
    const result = await createItem({
      title: 'Task',
      // @ts-expect-error Testing validation
      priority: 'invalid',
    })

    expect(result.success).toBe(false)
  })
})
```

Run tests:
```bash
npm test
# ❌ FAIL: priority is not a function...
```

**🟢 GREEN: Minimal implementation**

```typescript
// lib/db/schema.ts
export const items = sqliteTable('items', {
  // ... existing fields
  priority: text('priority', {
    enum: ['low', 'medium', 'high']
  }).notNull().default('medium'),
})

// lib/actions/items.ts
const createItemSchema = z.object({
  title: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
})

export async function createItem(input: z.infer<typeof createItemSchema>) {
  const validated = createItemSchema.parse(input)

  const newItem = {
    // ... existing fields
    priority: validated.priority,
  }

  // ... rest of implementation
}
```

Run tests:
```bash
npm test
# ✅ PASS: All tests passing!
```

**✨ REFACTOR: Improve design**

```typescript
// lib/constants/priorities.ts
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const

export type Priority = (typeof PRIORITIES)[keyof typeof PRIORITIES]

// lib/db/schema.ts
import { PRIORITIES } from '@/lib/constants/priorities'

export const items = sqliteTable('items', {
  priority: text('priority', {
    enum: Object.values(PRIORITIES)
  }).notNull().default(PRIORITIES.MEDIUM),
})

// lib/actions/items.ts
import { PRIORITIES } from '@/lib/constants/priorities'

const createItemSchema = z.object({
  priority: z.nativeEnum(PRIORITIES).default(PRIORITIES.MEDIUM),
})
```

Run tests:
```bash
npm test
# ✅ PASS: Still passing after refactor!
```

## Testing Pyramid

```
    ┌─────┐
    │ E2E │     ← Few (slow, brittle)
    └─────┘
   ┌────────┐
   │ Integr │   ← Some (medium speed)
   └────────┘
  ┌──────────┐
  │   Unit   │  ← Many (fast, focused)
  └──────────┘
```

### In 30-Minute Builds:

1. **Unit Tests (80%)** - Functions, utilities, validation
2. **Integration Tests (15%)** - Server actions with DB
3. **Component Tests (5%)** - Critical UI components
4. **E2E Tests (0%)** - Skip for demos, add later

## TDD Patterns for Common Scenarios

### 1. Server Actions (Database + Auth)

**Pattern:** Test authentication, validation, database operations

```typescript
describe('createInvoice', () => {
  // Setup
  let db: Awaited<ReturnType<typeof setupTestDb>>

  beforeEach(async () => {
    db = await setupTestDb()
    await clearDatabase(db)
    await seedTestUser(db)
  })

  // Test 1: Authentication
  it('should require authentication', async () => {
    const { auth } = await import('@clerk/nextjs')
    vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

    const result = await createInvoice({
      amount: 100,
      clientName: 'Client',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })

  // Test 2: Validation
  it('should validate amount is positive', async () => {
    const result = await createInvoice({
      amount: -100,
      clientName: 'Client',
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('positive')
  })

  // Test 3: Happy path
  it('should create invoice successfully', async () => {
    const result = await createInvoice({
      amount: 500,
      clientName: 'ACME Corp',
      dueDate: new Date('2024-12-31'),
    })

    expect(result.success).toBe(true)
    expect(result.data?.amount).toBe(500)
    expect(result.data?.clientName).toBe('ACME Corp')
    expect(result.data?.status).toBe('draft')
  })

  // Test 4: Edge cases
  it('should handle duplicate invoice numbers', async () => {
    await createInvoice({
      amount: 100,
      clientName: 'Client',
      invoiceNumber: 'INV-001',
    })

    const result = await createInvoice({
      amount: 200,
      clientName: 'Client',
      invoiceNumber: 'INV-001', // Duplicate!
    })

    expect(result.success).toBe(false)
    expect(result.error).toContain('already exists')
  })
})
```

### 2. Complex Business Logic

**Pattern:** Test all paths, edge cases, error handling

```typescript
describe('calculateInvoiceTotal', () => {
  it('should calculate subtotal', () => {
    const items = [
      { quantity: 2, unitPrice: 50 },
      { quantity: 3, unitPrice: 30 },
    ]

    const result = calculateInvoiceTotal(items)

    expect(result.subtotal).toBe(190) // (2*50) + (3*30)
  })

  it('should apply discount', () => {
    const items = [{ quantity: 1, unitPrice: 100 }]

    const result = calculateInvoiceTotal(items, { discount: 10 })

    expect(result.subtotal).toBe(100)
    expect(result.discountAmount).toBe(10)
    expect(result.total).toBe(90)
  })

  it('should calculate tax', () => {
    const items = [{ quantity: 1, unitPrice: 100 }]

    const result = calculateInvoiceTotal(items, { taxRate: 0.1 })

    expect(result.subtotal).toBe(100)
    expect(result.taxAmount).toBe(10)
    expect(result.total).toBe(110)
  })

  it('should apply discount before tax', () => {
    const items = [{ quantity: 1, unitPrice: 100 }]

    const result = calculateInvoiceTotal(items, {
      discount: 10,
      taxRate: 0.1,
    })

    // 100 - 10 = 90 (after discount)
    // 90 * 0.1 = 9 (tax on discounted amount)
    // 90 + 9 = 99 (total)

    expect(result.total).toBe(99)
  })

  it('should handle empty items', () => {
    const result = calculateInvoiceTotal([])

    expect(result.subtotal).toBe(0)
    expect(result.total).toBe(0)
  })

  it('should handle zero quantities', () => {
    const items = [{ quantity: 0, unitPrice: 100 }]

    const result = calculateInvoiceTotal(items)

    expect(result.subtotal).toBe(0)
  })
})
```

### 3. Component Testing

**Pattern:** Test rendering, user interactions, state changes

```typescript
describe('InvoiceForm', () => {
  it('should render all fields', () => {
    render(<InvoiceForm />)

    expect(screen.getByLabelText(/client name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument()
  })

  it('should validate required fields', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<InvoiceForm onSubmit={onSubmit} />)

    // Try to submit without filling fields
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Should show validation errors
    expect(screen.getByText(/client name is required/i)).toBeInTheDocument()
    expect(screen.getByText(/amount is required/i)).toBeInTheDocument()

    // Should not call onSubmit
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('should submit valid data', async () => {
    const onSubmit = vi.fn()
    const user = userEvent.setup()

    render(<InvoiceForm onSubmit={onSubmit} />)

    // Fill in form
    await user.type(screen.getByLabelText(/client name/i), 'ACME Corp')
    await user.type(screen.getByLabelText(/amount/i), '1000')
    await user.type(screen.getByLabelText(/due date/i), '2024-12-31')

    // Submit
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Should call onSubmit with correct data
    expect(onSubmit).toHaveBeenCalledWith({
      clientName: 'ACME Corp',
      amount: 1000,
      dueDate: '2024-12-31',
    })
  })

  it('should show loading state during submission', async () => {
    const onSubmit = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 100)))
    const user = userEvent.setup()

    render(<InvoiceForm onSubmit={onSubmit} />)

    // Fill and submit
    await user.type(screen.getByLabelText(/client name/i), 'Test')
    await user.type(screen.getByLabelText(/amount/i), '100')
    await user.click(screen.getByRole('button', { name: /create/i }))

    // Should show loading state
    expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
  })
})
```

### 4. AI Features (Mocked)

**Pattern:** Mock AI responses, test error handling

```typescript
import { vi } from 'vitest'
import { generateText } from 'ai'

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

describe('AI Invoice Analysis', () => {
  it('should analyze invoice for anomalies', async () => {
    // Mock AI response
    vi.mocked(generateText).mockResolvedValueOnce({
      text: JSON.stringify({
        anomalies: ['Amount unusually high for this client'],
        riskScore: 7,
        recommendation: 'Review before sending',
      }),
    } as any)

    const result = await analyzeInvoice({
      clientName: 'Small Corp',
      amount: 100000, // Unusually high
    })

    expect(result.anomalies).toHaveLength(1)
    expect(result.riskScore).toBe(7)
  })

  it('should handle AI errors gracefully', async () => {
    // Mock AI failure
    vi.mocked(generateText).mockRejectedValueOnce(new Error('AI service down'))

    const result = await analyzeInvoice({
      clientName: 'Client',
      amount: 1000,
    })

    expect(result.error).toBeDefined()
    expect(result.error).toContain('Analysis unavailable')
  })

  it('should retry on timeout', async () => {
    // First call times out
    vi.mocked(generateText)
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce({
        text: JSON.stringify({ anomalies: [], riskScore: 0 }),
      } as any)

    const result = await analyzeInvoice({
      clientName: 'Client',
      amount: 1000,
    })

    expect(generateText).toHaveBeenCalledTimes(2)
    expect(result.anomalies).toHaveLength(0)
  })
})
```

## 30-Minute TDD Workflow

### Minutes 0-5: Schema & Types First

```typescript
// 1. Write schema test
describe('invoices schema', () => {
  it('should create invoice', async () => {
    await db.insert(invoices).values({
      id: 'inv_1',
      clientName: 'Test',
      amount: 100,
      userId: 'user_1',
    })

    const result = await db.select().from(invoices)
    expect(result).toHaveLength(1)
  })
})

// 2. Implement schema
export const invoices = sqliteTable('invoices', {
  // ...
})

// 3. npm test → GREEN ✅
```

### Minutes 5-10: Validation Logic

```typescript
// 1. Write validation tests
describe('invoice validation', () => {
  it('should reject negative amounts', () => {
    const result = invoiceSchema.safeParse({
      amount: -100,
    })
    expect(result.success).toBe(false)
  })
})

// 2. Implement validation
const invoiceSchema = z.object({
  amount: z.number().positive(),
})

// 3. npm test → GREEN ✅
```

### Minutes 10-20: Server Actions

```typescript
// 1. Write action tests (all scenarios)
describe('createInvoice', () => {
  // Auth, validation, happy path, edge cases
})

// 2. Implement action
export async function createInvoice() {
  // Minimal implementation to pass tests
}

// 3. npm test → GREEN ✅

// 4. Refactor for clarity
// Tests still GREEN ✅
```

### Minutes 20-25: UI Components

```typescript
// 1. Write component tests
describe('InvoiceForm', () => {
  // Render, validation, submission
})

// 2. Implement component
export function InvoiceForm() {
  // Minimal implementation
}

// 3. npm test → GREEN ✅
```

### Minutes 25-30: Integration & Polish

```typescript
// 1. Test full flow
it('should create invoice end-to-end', async () => {
  // Full user journey
})

// 2. Fix any integration issues

// 3. Deploy!
```

## TDD Anti-Patterns to Avoid

### ❌ Testing Implementation Details

```typescript
// Bad: Testing internal state
it('should set isLoading to true', () => {
  const component = render(<Form />)
  expect(component.state.isLoading).toBe(true)
})

// Good: Testing behavior
it('should show loading indicator', () => {
  render(<Form />)
  expect(screen.getByText(/loading/i)).toBeInTheDocument()
})
```

### ❌ Writing Tests After Code

```typescript
// Bad: Code first, test later
function createInvoice() {
  // ... 100 lines of code
}

// Then write tests

// Good: Test first, then code
describe('createInvoice', () => {
  it('should work', () => { ... })
})

function createInvoice() {
  // Minimal code to pass test
}
```

### ❌ One Giant Test

```typescript
// Bad: Testing everything at once
it('should do everything', async () => {
  const user = await createUser()
  const invoice = await createInvoice()
  await sendEmail()
  await processPayment()
  // ... 50 more lines
})

// Good: Focused tests
describe('Invoice lifecycle', () => {
  it('should create invoice', () => { ... })
  it('should send email notification', () => { ... })
  it('should process payment', () => { ... })
})
```

### ❌ Testing External Services

```typescript
// Bad: Actually calling Stripe API
it('should charge customer', async () => {
  const charge = await stripe.charges.create({ ... })
  expect(charge.status).toBe('succeeded')
})

// Good: Mock external services
vi.mock('stripe', () => ({ ... }))

it('should charge customer', async () => {
  const charge = await createCharge({ ... })
  expect(mockStripe.charges.create).toHaveBeenCalled()
})
```

## Coverage Goals

For 30-minute demos:

- **Critical paths:** 100% (auth, payments, data integrity)
- **Business logic:** 80% (calculations, validations)
- **UI components:** 60% (critical flows only)
- **Utilities:** 90% (easy to test, high value)

```bash
npm run test:coverage
```

Look for:
- ✅ All server actions tested
- ✅ All validation tested
- ✅ Critical user flows tested
- ⚠️ Edge cases covered
- ❌ Don't worry about styling tests

## Quick Reference

```bash
# Run tests
npm test

# Watch mode (auto-run on save)
npm run test:watch

# UI mode (visual test runner)
npm run test:ui

# Coverage report
npm run test:coverage

# Run specific test file
npm test items.test.ts

# Run tests matching pattern
npm test -- -t "should create"
```

## Common Test Scenarios

### Testing Dates

```typescript
it('should create with current timestamp', async () => {
  const now = new Date('2024-01-01T00:00:00Z')
  vi.setSystemTime(now)

  const result = await createItem({ title: 'Test' })

  expect(result.data?.createdAt).toEqual(now)

  vi.useRealTimers()
})
```

### Testing Async Operations

```typescript
it('should handle async errors', async () => {
  const promise = riskyOperation()

  await expect(promise).rejects.toThrow('Expected error')
})
```

### Testing Timers

```typescript
it('should debounce calls', async () => {
  vi.useFakeTimers()

  const fn = vi.fn()
  const debounced = debounce(fn, 100)

  debounced()
  debounced()
  debounced()

  vi.advanceTimersByTime(100)

  expect(fn).toHaveBeenCalledTimes(1)

  vi.useRealTimers()
})
```

## Remember

1. **Red → Green → Refactor** - Follow the cycle
2. **Test behavior, not implementation** - Focus on what, not how
3. **Keep tests simple** - If test is complex, code might be too
4. **One assert per test** - Makes failures clear
5. **Tests are documentation** - Write for readability

**Happy Testing! 🧪**
