# RapidProto Testing Strategy

## Test Architecture

RapidProto uses a **two-tier testing approach** optimized for rapid 30-minute builds:

### 1. Core Library Tests (Root Level)

**Location:** `lib/builder.test.ts`, `lib/facilitator.test.ts`

**Purpose:** Test the core business logic that orchestrates all sessions.

**Run from root:**
```bash
npm test                  # Run core tests
npm run test:watch        # Watch mode
npm run test:coverage     # With coverage
```

**What's tested:**
- Template selection algorithm
- Project initialization logic
- Progress tracking calculations
- Status communication formatting
- Demo script generation
- Discovery question generation
- Problem excavation
- Engagement activity planning
- Demo orchestration
- Follow-up email generation

**Result:** 45 tests (20 builder + 25 facilitator)

---

### 2. Template Tests (Individual Directories)

**Location:** Each `template-*/` directory has its own test suite

**Purpose:** Ensure templates are production-ready for instant cloning during client sessions.

**Run from template directory:**
```bash
cd template-16-client-intake
npm test                  # Run template-specific tests
```

**What's tested (per template):**
- Database schema validation
- Server actions (CRUD operations)
- UI components (React Testing Library)
- Business logic specific to that template
- Integration tests

**Why separate?**
- Each template is a self-contained Next.js app
- Templates use `@/` path aliases pointing to their own directories
- When cloned for a client build, templates run independently
- Avoids monorepo test complexity

---

## CI/CD Strategy

### Pre-Commit (Root Level)
```bash
npm test  # Must pass - core lib/ tests
```

### Template Validation (On Template Changes)
```bash
cd template-XX
npm test  # Run when modifying that template
```

### Full Repository Validation
```bash
# Test core
npm test

# Test all templates (CI script)
for dir in template-* base-template; do
  (cd "$dir" && npm test)
done
```

---

## Why This Matters for 30-Minute Builds

**Problem:** During a live client session, runtime bugs are catastrophic.

**Solution:** All templates have dependencies installed and tests passing BEFORE the session starts.

**Workflow:**
1. **Pre-session:** Builder reviews client requirements
2. **Minute 0-10:** Facilitator leads discovery, Builder selects template
3. **Minute 10:** Builder clones template (already tested, ready to run)
4. **Minute 10-30:** Builder customizes (schema, logic, UI)
5. **Minute 30-40:** Demo (no surprises, template foundation is solid)

**If templates aren't tested:** Builder wastes precious minutes debugging template infrastructure instead of building the MVP.

---

## Dependencies

**Root level:** Minimal (vitest, typescript, types)

**Each template:** Full Next.js stack
- Next.js 14+
- React 18+
- Drizzle ORM
- Clerk Auth
- Vercel AI SDK
- Tailwind CSS
- shadcn/ui components
- Testing libraries

**All dependencies installed:** ✅ (run once, use many times)

---

## Adding New Templates

When creating a new template:

1. **Copy base-template** structure
2. **Install dependencies** in template directory
3. **Write tests first** (TDD approach)
4. **Run template tests** until passing
5. **Commit** when all tests green

**Never commit untested templates.** They become time bombs during live sessions.

---

## Testing Template Changes

**When modifying an existing template:**

```bash
# 1. Make changes in template
cd template-16-client-intake

# 2. Run tests
npm test

# 3. If adding features, write tests first
npm run test:watch

# 4. Commit only when tests pass
git add .
git commit -m "feat: add conflict checking to client intake"
```

**When modifying core lib/ functions:**

```bash
# 1. Make changes in lib/
# 2. Run core tests from root
npm test

# 3. Tests must pass before commit
git add lib/
git commit -m "feat: improve template matching algorithm"
```

---

## Test Commands Reference

| Command | Location | Purpose |
|---------|----------|---------|
| `npm test` | Root | Run core lib/ tests (45 tests) |
| `npm run test:watch` | Root | Watch core tests |
| `npm run test:coverage` | Root | Core tests with coverage |
| `npm test` | Template dir | Run template-specific tests |
| `npm run test:ui` | Template dir | Vitest UI for debugging |
| `npm run ci` | Template dir | Full validation (type-check + lint + test + build) |

---

**Bottom line:** Fast, reliable templates enable fast, reliable 30-minute builds.
