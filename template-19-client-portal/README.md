# Template #19: Client Portal

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

```bash
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
```

---

## Customization Guide

### 1. Configure Business Rules
Edit `lib/actions/index.ts` to adjust business logic

### 2. Customize UI
Modify components in `components/`

### 3. Add Custom Fields
Update schema in `lib/db/schema.ts`

---

## API Reference

### Server Actions

#### `createItem(data)`
Creates a new item

#### `getItems()`
Retrieves all items

#### `getItem(id)`
Retrieves a single item

#### `updateItem(id, data)`
Updates an existing item

#### `deleteItem(id)`
Deletes an item

---

## Testing

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

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
