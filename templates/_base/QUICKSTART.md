# Quick Start: 5 Minutes to First Demo

## Installation (2 minutes)

```bash
# Clone template
git clone <this-repo> my-project
cd my-project

# Install dependencies
npm install

# Run setup wizard
npm run setup
# OR use Make
make setup
```

The wizard will ask for:
1. **Turso database** credentials (or create new)
2. **Clerk** auth keys
3. **Resend** email key (optional)

## Verify Everything Works (1 minute)

```bash
# Run tests (should all pass)
npm test

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

You should see a working Next.js app with Clerk auth!

## Deploy Skeleton (1 minute)

```bash
# Deploy to Vercel
vercel --prod
```

✅ **You now have a deployed, authenticated, tested app!**

## Customize for Your Client (1 minute)

Edit `lib/db/schema.ts` for your domain:

```typescript
// Example: Invoice app
export const invoices = sqliteTable('invoices', {
  id: text('id').primaryKey(),
  clientName: text('client_name').notNull(),
  amount: real('amount').notNull(),
  dueDate: integer('due_date', { mode: 'timestamp' }).notNull(),
  userId: text('user_id').notNull(),
})
```

Push schema:
```bash
npm run db:push
```

## Build Features (25 minutes)

Follow TDD workflow:

1. **Write test** (see `TDD_GUIDE.md` for examples)
2. **Run tests** - `npm test` (should fail ❌)
3. **Write code** to pass test
4. **Run tests** - `npm test` (should pass ✅)
5. **Refactor** while keeping tests green
6. **Deploy** - `vercel --prod`

## Example: Add a Feature in 10 Minutes

Let's add "invoice status tracking":

### 1. Write Test (2 min)

```typescript
// lib/actions/__tests__/invoices.test.ts
describe('updateInvoiceStatus', () => {
  it('should mark invoice as paid', async () => {
    const invoice = await createInvoice({
      clientName: 'ACME',
      amount: 1000,
    })

    const result = await updateInvoiceStatus(invoice.data!.id, 'paid')

    expect(result.success).toBe(true)
    expect(result.data?.status).toBe('paid')
    expect(result.data?.paidAt).toBeInstanceOf(Date)
  })
})
```

### 2. Run Test (30 sec)

```bash
npm test
# ❌ FAIL: updateInvoiceStatus is not defined
```

### 3. Implement (5 min)

```typescript
// lib/actions/invoices.ts
export async function updateInvoiceStatus(
  id: string,
  status: 'draft' | 'sent' | 'paid'
) {
  const { userId } = auth()
  if (!userId) return { success: false, error: 'Unauthorized' }

  const [updated] = await db
    .update(invoices)
    .set({
      status,
      paidAt: status === 'paid' ? new Date() : null,
    })
    .where(and(eq(invoices.id, id), eq(invoices.userId, userId)))
    .returning()

  if (!updated) return { success: false, error: 'Not found' }

  return { success: true, data: updated }
}
```

### 4. Run Test Again (30 sec)

```bash
npm test
# ✅ PASS: All tests passing!
```

### 5. Deploy (1 min)

```bash
vercel --prod
```

**Done! Feature shipped in 10 minutes with tests.** ✅

## Common Tasks

```bash
# Development
npm run dev              # Start dev server
npm test                 # Run all tests
npm run test:watch       # Watch mode (auto-run)
npm run test:ui          # Visual test runner

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open database GUI

# Build
npm run build            # Build for production
vercel --prod            # Deploy to Vercel

# Quality
npm run lint             # Run linter
npm run type-check       # TypeScript check
npm run ci               # Run all checks
```

## File Structure

```
├── lib/
│   ├── db/              # Database schema and client
│   ├── actions/         # Server actions (business logic)
│   └── utils/           # Utilities and helpers
│
├── components/
│   └── ui/              # shadcn/ui components
│
├── app/                 # Next.js app router
│   ├── (auth)/         # Protected routes
│   └── api/            # API routes
│
└── test/                # Test utilities
```

## Getting Help

- **Setup issues?** Check `.env.local` has all required keys
- **Tests failing?** Read error message, check `TDD_GUIDE.md`
- **Deploy issues?** Verify environment variables in Vercel
- **Need examples?** Check `lib/actions/__tests__/` for patterns

## What's Included

✅ Next.js 14 + TypeScript
✅ Clerk authentication (ready to use)
✅ Turso database (SQLite at edge)
✅ Drizzle ORM (type-safe queries)
✅ Vitest + Testing Library (full coverage)
✅ shadcn/ui components
✅ Tailwind CSS
✅ Vercel AI SDK (no API keys needed)
✅ Email with Resend
✅ File upload with Vercel Blob

## Tips for 30-Minute Builds

1. **Don't skip tests** - They save time, not waste it
2. **Copy test patterns** - Look at existing tests as templates
3. **Keep it simple** - Minimal code to pass tests
4. **Deploy early** - Don't wait until "perfect"
5. **Use Make commands** - `make test`, `make deploy`

## Next Steps

1. Read `README.md` for detailed setup guide
2. Read `TDD_GUIDE.md` for testing patterns
3. Start building!

---

**You're ready! Build something awesome in 30 minutes. 🚀**
