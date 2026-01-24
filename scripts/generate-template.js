#!/usr/bin/env node
/**
 * RapidProto Template Generator
 *
 * Scaffolds a new template with:
 * - Directory structure
 * - Basic schema
 * - Server actions with test stubs
 * - Component stubs
 * - Documentation files
 *
 * Usage: node scripts/generate-template.js <template-number> <template-name>
 * Example: node scripts/generate-template.js 26 "Service Appointments"
 */

const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length < 2) {
  console.error('Usage: node generate-template.js <number> <name>')
  console.error('Example: node generate-template.js 26 "Service Appointments"')
  process.exit(1)
}

const templateNumber = args[0]
const templateName = args[1]
const kebabName = templateName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
const pascalName = templateName.replace(/\s+/g, '').replace(/\b\w/g, l => l.toUpperCase())
const templateDir = `template-${templateNumber}-${kebabName}`

console.log(`\n🚀 Generating Template #${templateNumber}: ${templateName}`)
console.log(`   Directory: ${templateDir}\n`)

// Create directory structure
const dirs = [
  templateDir,
  `${templateDir}/lib`,
  `${templateDir}/lib/db`,
  `${templateDir}/lib/actions`,
  `${templateDir}/lib/utils`,
  `${templateDir}/components`,
  `${templateDir}/__tests__`,
]

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`✅ Created: ${dir}`)
  }
})

// Generate schema.ts
const schemaContent = `/**
 * Template #${templateNumber}: ${templateName}
 * Database schema
 */

import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

// TODO: Define your database tables here
// Example:
export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  status: text('status').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
})

export type Item = typeof items.$inferSelect
`

fs.writeFileSync(`${templateDir}/lib/db/schema.ts`, schemaContent)
console.log(`✅ Created: schema.ts`)

// Generate schema.test.ts
const schemaTestContent = `/**
 * Tests for Template #${templateNumber} schema
 */

import { describe, it, expect } from 'vitest'
import { items } from './schema'

describe('Template #${templateNumber}: ${templateName} Schema', () => {
  describe('Items Table', () => {
    it('should have required fields', () => {
      expect(items).toBeDefined()
      expect(items.id).toBeDefined()
      expect(items.name).toBeDefined()
      expect(items.status).toBeDefined()
    })

    // TODO: Add more schema tests
  })
})
`

fs.writeFileSync(`${templateDir}/lib/db/schema.test.ts`, schemaTestContent)
console.log(`✅ Created: schema.test.ts`)

// Generate actions/index.ts
const actionsContent = `/**
 * Template #${templateNumber}: ${templateName}
 * Server actions
 */

'use server'

import { db } from '@/lib/db'
import { items } from '../db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

// Validation schemas
export const createItemSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})

// Create item
export async function createItem(data: z.infer<typeof createItemSchema>) {
  const validated = createItemSchema.parse(data)

  const [item] = await db.insert(items).values({
    id: crypto.randomUUID(),
    ...validated,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning()

  return { success: true, data: item }
}

// Get all items
export async function getItems() {
  const allItems = await db.select().from(items)
  return { success: true, data: allItems }
}

// Get single item
export async function getItem(id: string) {
  const [item] = await db.select().from(items).where(eq(items.id, id))
  if (!item) {
    return { success: false, error: 'Item not found' }
  }
  return { success: true, data: item }
}

// Update item
export async function updateItem(id: string, data: Partial<z.infer<typeof createItemSchema>>) {
  const [item] = await db
    .update(items)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(items.id, id))
    .returning()

  if (!item) {
    return { success: false, error: 'Item not found' }
  }

  return { success: true, data: item }
}

// Delete item
export async function deleteItem(id: string) {
  await db.delete(items).where(eq(items.id, id))
  return { success: true }
}
`

fs.writeFileSync(`${templateDir}/lib/actions/index.ts`, actionsContent)
console.log(`✅ Created: actions/index.ts`)

// Generate actions/index.test.ts
const actionsTestContent = `/**
 * Tests for Template #${templateNumber} actions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createItem, getItems, getItem, updateItem, deleteItem } from './index'

// Mock database
vi.mock('@/lib/db', () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => [{ id: 'item_123', name: 'Test Item' }]),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => []),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => [{ id: 'item_123' }]),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(),
    })),
  },
}))

describe('Template #${templateNumber}: ${templateName} Actions', () => {
  describe('createItem', () => {
    it('should create a new item', async () => {
      const result = await createItem({
        name: 'Test Item',
        status: 'active',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
    })

    it('should validate required fields', async () => {
      await expect(createItem({ name: '', status: 'active' })).rejects.toThrow()
    })
  })

  describe('getItems', () => {
    it('should return all items', async () => {
      const result = await getItems()
      expect(result.success).toBe(true)
      expect(Array.isArray(result.data)).toBe(true)
    })
  })

  // TODO: Add more action tests
})
`

fs.writeFileSync(`${templateDir}/lib/actions/index.test.ts`, actionsTestContent)
console.log(`✅ Created: actions/index.test.ts`)

// Generate README.md
const readmeContent = `# Template #${templateNumber}: ${templateName}

**Category:** TBD
**Build Time:** 25-30 minutes
**Complexity:** ⭐⭐
**Status:** Scaffolded - Implementation needed

---

## Overview

Brief description of what this template does and who it's for.

### Target Users
- Industry 1
- Industry 2
- Industry 3

### Core Features
- Feature 1
- Feature 2
- Feature 3

### AI Enhancements
- AI Feature 1
- AI Feature 2

---

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npm run db:push

# Run tests
npm test

# Start development server
npm run dev
\`\`\`

---

## Customization Guide

### 1. Configure Business Rules
Edit \`lib/actions/index.ts\` to adjust business logic

### 2. Customize UI
Modify components in \`components/\`

### 3. Add Custom Fields
Update schema in \`lib/db/schema.ts\`

---

## API Reference

### Server Actions

#### \`createItem(data)\`
Creates a new item

#### \`getItems()\`
Retrieves all items

#### \`getItem(id)\`
Retrieves a single item

#### \`updateItem(id, data)\`
Updates an existing item

#### \`deleteItem(id)\`
Deletes an item

---

## Testing

\`\`\`bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
\`\`\`

---

## Deployment

See main RapidProto README for deployment instructions.

---

## Next Steps

1. Implement specific business logic
2. Build out UI components
3. Add AI features
4. Write comprehensive tests
5. Create demo script
`

fs.writeFileSync(`${templateDir}/README.md`, readmeContent)
console.log(`✅ Created: README.md`)

// Generate package.json
const packageJson = {
  name: `@rapidproto/template-${templateNumber}-${kebabName}`,
  version: '0.1.0',
  private: true,
  scripts: {
    dev: 'next dev',
    build: 'next build',
    start: 'next start',
    test: 'vitest',
    'db:push': 'drizzle-kit push:sqlite',
  },
}

fs.writeFileSync(`${templateDir}/package.json`, JSON.stringify(packageJson, null, 2))
console.log(`✅ Created: package.json`)

// Generate Makefile
const makefileContent = `.PHONY: test dev build

test:
\tvitest run

test-watch:
\tvitest

dev:
\tnpm run dev

build:
\tnpm run build

db-push:
\tnpm run db:push
`

fs.writeFileSync(`${templateDir}/Makefile`, makefileContent)
console.log(`✅ Created: Makefile`)

console.log(`\n✨ Template #${templateNumber} scaffolded successfully!`)
console.log(`\n📝 Next steps:`)
console.log(`   1. cd ${templateDir}`)
console.log(`   2. Implement schema in lib/db/schema.ts`)
console.log(`   3. Write tests in lib/db/schema.test.ts`)
console.log(`   4. Implement actions in lib/actions/index.ts`)
console.log(`   5. Write action tests in lib/actions/index.test.ts`)
console.log(`   6. Build UI components`)
console.log(`   7. Write component tests`)
console.log(`   8. Create DEMO_SCRIPT.md\n`)
