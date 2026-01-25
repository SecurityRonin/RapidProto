# 50-Minute MVP Base Template

**Opinionated starter for rapid business application development**

Built with TDD (Test-Driven Development) principles for reliable, maintainable code.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** shadcn/ui + Tailwind CSS
- **Database:** Turso (SQLite at the edge)
- **ORM:** Drizzle
- **Auth:** Clerk
- **AI:** Vercel AI SDK + AI Gateway (NO BYOK)
- **Email:** Resend
- **Storage:** Vercel Blob
- **Testing:** Vitest + React Testing Library
- **Deployment:** Vercel

## Quick Start

### 1. Clone and Install

```bash
git clone <this-template> my-project
cd my-project
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Fill in your credentials:

**Clerk (Auth):**
1. Go to https://dashboard.clerk.com
2. Create new application
3. Copy publishable key and secret key

**Turso (Database):**
```bash
# Install Turso CLI
curl -sSfL https://get.tur.so/install.sh | bash

# Login
turso auth login

# Create database
turso db create my-project-db

# Get URL and token
turso db show my-project-db --url
turso db tokens create my-project-db
```

**Resend (Email - Optional):**
1. Go to https://resend.com
2. Create API key

### 3. Push Database Schema

```bash
npm run db:push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Run Tests

```bash
npm test
```

## Development Workflow (TDD)

### The Red-Green-Refactor Cycle

1. **Red:** Write a failing test
2. **Green:** Write minimal code to pass the test
3. **Refactor:** Improve code while keeping tests green

### Example: Adding a New Feature

Let's add a "tags" feature to items.

#### 1. Write the Test First

```typescript
// lib/actions/__tests__/items.test.ts

describe('Item tags', () => {
  it('should add tags to an item', async () => {
    const item = await createItem({
      title: 'Task',
      tags: ['urgent', 'bug']
    })

    expect(item.data?.tags).toEqual(['urgent', 'bug'])
  })

  it('should filter items by tag', async () => {
    await createItem({ title: 'Bug', tags: ['bug'] })
    await createItem({ title: 'Feature', tags: ['feature'] })

    const result = await getItems({ tag: 'bug' })

    expect(result.data).toHaveLength(1)
    expect(result.data?.[0].title).toBe('Bug')
  })
})
```

#### 2. Run Tests (They Should Fail)

```bash
npm test
# ❌ Tests fail - tags not implemented yet
```

#### 3. Update Schema

```typescript
// lib/db/schema.ts

export const items = sqliteTable('items', {
  // ... existing fields
  tags: text('tags'), // JSON array
})
```

#### 4. Update Actions

```typescript
// lib/actions/items.ts

const createItemSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(), // Add this
})

export async function createItem(input: z.infer<typeof createItemSchema>) {
  // ... existing code
  const newItem = {
    // ... existing fields
    tags: input.tags ? JSON.stringify(input.tags) : null,
  }
  // ... rest of code
}

export async function getItems(filters?: {
  status?: 'active' | 'inactive' | 'archived'
  tag?: string // Add this
}) {
  // ... add tag filtering logic
}
```

#### 5. Run Tests Again

```bash
npm test
# ✅ Tests pass!
```

#### 6. Refactor

Now improve the code quality while keeping tests green.

```typescript
// lib/utils/tags.ts

export function parseTags(tagsJson: string | null): string[] {
  if (!tagsJson) return []
  try {
    return JSON.parse(tagsJson)
  } catch {
    return []
  }
}

export function serializeTags(tags: string[]): string {
  return JSON.stringify(tags)
}
```

Update actions to use these utilities, tests still pass.

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Auth-protected routes
│   ├── (public)/          # Public routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn components
│   └── __tests__/        # Component tests
├── lib/                   # Core logic
│   ├── actions/          # Server actions
│   │   └── __tests__/    # Action tests
│   ├── db/               # Database
│   │   ├── schema.ts     # Drizzle schema
│   │   ├── index.ts      # DB client
│   │   └── __tests__/    # Schema tests
│   └── utils/            # Utilities
│       └── __tests__/    # Utility tests
├── test/                  # Test configuration
│   ├── setup.ts          # Global test setup
│   └── db-helpers.ts     # DB test utilities
├── drizzle/              # Generated migrations
├── vitest.config.ts      # Vitest configuration
└── package.json          # Dependencies

```

## Testing Patterns

### Database Tests

```typescript
import { setupTestDb, seedTestUser, clearDatabase } from '@/test/db-helpers'

describe('My Feature', () => {
  let db: Awaited<ReturnType<typeof setupTestDb>>

  beforeEach(async () => {
    db = await setupTestDb()
    await clearDatabase(db)
    await seedTestUser(db)
  })

  it('should work', async () => {
    // Your test here
  })
})
```

### Server Action Tests

```typescript
import { vi } from 'vitest'

// Mock auth
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({ userId: 'user_test123' })),
}))

describe('Server Actions', () => {
  it('should require authentication', async () => {
    const { auth } = await import('@clerk/nextjs')
    vi.mocked(auth).mockReturnValueOnce({ userId: null } as any)

    const result = await myAction()

    expect(result.success).toBe(false)
    expect(result.error).toContain('Unauthorized')
  })
})
```

### Component Tests

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MyComponent } from './MyComponent'

describe('MyComponent', () => {
  it('should render', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('should handle click', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()

    render(<MyComponent onClick={handleClick} />)
    await user.click(screen.getByRole('button'))

    expect(handleClick).toHaveBeenCalled()
  })
})
```

## Scripts

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Watch mode
npm run test:ui          # Open Vitest UI
npm run test:coverage    # Generate coverage report

# Database
npm run db:push          # Push schema changes
npm run db:studio        # Open Drizzle Studio
npm run db:generate      # Generate migrations

# Quality
npm run lint             # Run ESLint
npm run type-check       # TypeScript check
npm run ci               # Run all checks (CI)
```

## 30-Minute Build Checklist

When cloning this template for a client demo:

```bash
# 0-2 min: Setup
[ ] Clone template
[ ] npm install
[ ] Copy .env.example to .env.local
[ ] Fill in Clerk, Turso credentials

# 2-3 min: Database
[ ] Update schema in lib/db/schema.ts
[ ] npm run db:push

# 3-5 min: Deploy skeleton
[ ] vercel --prod
[ ] Test deployment works

# 5-30 min: Build features
[ ] Write tests first
[ ] Implement features
[ ] Keep tests passing
[ ] Deploy updates

# 30 min: Demo ready!
```

## Best Practices

### Always Write Tests First

```typescript
// ❌ Bad: Write code, then test
// 1. Write feature
// 2. Write test
// 3. Hope it works

// ✅ Good: Write test, then code
// 1. Write failing test
// 2. Write minimal code to pass
// 3. Refactor while keeping tests green
```

### Keep Tests Focused

```typescript
// ❌ Bad: Testing too much
it('should do everything', async () => {
  const user = await createUser()
  const item = await createItem()
  await updateItem()
  await deleteItem()
  // Testing entire flow
})

// ✅ Good: One thing per test
it('should create a user', async () => {
  const user = await createUser()
  expect(user).toBeDefined()
})

it('should create an item', async () => {
  const item = await createItem()
  expect(item.title).toBe('Test')
})
```

### Use Descriptive Test Names

```typescript
// ❌ Bad
it('works', async () => { ... })

// ✅ Good
it('should create a new item when given valid data', async () => { ... })
it('should reject creation when user is not authenticated', async () => { ... })
it('should return validation error when title is empty', async () => { ... })
```

### Mock External Dependencies

```typescript
// ❌ Bad: Testing live API
it('should send email', async () => {
  await sendEmail('test@example.com')
  // Sends actual email!
})

// ✅ Good: Mock email service
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: { send: vi.fn(() => Promise.resolve({ id: '123' })) }
  }))
}))

it('should send email', async () => {
  await sendEmail('test@example.com')
  // No actual email sent, just mocked
})
```

## Extending This Template

### Adding a New Entity

1. **Add schema:**
   ```typescript
   // lib/db/schema.ts
   export const myEntity = sqliteTable('my_entity', { ... })
   ```

2. **Write action tests:**
   ```typescript
   // lib/actions/__tests__/myEntity.test.ts
   describe('myEntity actions', () => { ... })
   ```

3. **Implement actions:**
   ```typescript
   // lib/actions/myEntity.ts
   export async function createMyEntity() { ... }
   ```

4. **Add UI components:**
   ```typescript
   // components/MyEntityForm.tsx
   ```

5. **Write component tests:**
   ```typescript
   // components/__tests__/MyEntityForm.test.tsx
   ```

## AI Features (Vercel AI Gateway)

No API keys needed! Examples:

```typescript
// app/api/chat/route.ts
import { openai } from '@ai-sdk/openai'
import { streamText } from 'ai'

export async function POST(req: Request) {
  const { messages } = await req.json()

  const result = await streamText({
    model: openai('gpt-4o'),
    messages,
  })

  return result.toDataStreamResponse()
}
```

Test AI features:

```typescript
import { vi } from 'vitest'

vi.mock('ai', () => ({
  streamText: vi.fn(() => ({
    toDataStreamResponse: () => new Response('AI response'),
  })),
}))
```

## Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Environment variables are auto-configured
# for Vercel Blob, AI Gateway, etc.
```

### Environment Variables on Vercel

1. Go to project settings
2. Add environment variables:
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `RESEND_API_KEY` (optional)

## Troubleshooting

### Tests failing with "Cannot find module"

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Database connection errors

```bash
# Verify Turso credentials
turso db show my-project-db

# Test connection
turso db shell my-project-db
```

### Clerk auth not working

1. Check environment variables
2. Verify middleware is set up (see `middleware.ts`)
3. Check Clerk dashboard for API key

## Contributing

This is a template. Fork and customize for your needs!

## License

MIT

---

**Built with ❤️ for rapid MVPs**

Ready to build in 30 minutes? Let's go! 🚀
