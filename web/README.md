# RapidProto Session Assistant

**The meta-app that orchestrates the entire 50-minute MVP process**

**Category:** Process Orchestration
**Build Time:** N/A (scaffolded infrastructure)
**Complexity:** ⭐⭐⭐
**Status:** Backend Complete ✅ | Bridge Layer Complete ✅ | Frontend UI In Progress

---

## Overview

The RapidProto Session Assistant is the core application that guides both Builders and Facilitators through the 50-minute MVP delivery process. It integrates with the core `lib/builder.ts` and `lib/facilitator.ts` workflow functions through a bridge layer that connects session management to the underlying business logic.

### Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     Session UI                           │
│  (components: dashboard, timer, checklist, forms)        │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│                Bridge Actions Layer                      │
│  (builder-bridge.ts + facilitator-bridge.ts)            │
│  - Session data transformation                           │
│  - Database queries                                      │
│  - Core function invocation                              │
└────────────────────┬────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────┐
│              Core Business Logic                         │
│  (lib/builder.ts + lib/facilitator.ts)                  │
│  - Template matching                                     │
│  - Progress tracking                                     │
│  - Demo orchestration                                    │
│  - Follow-up generation                                  │
└─────────────────────────────────────────────────────────┘
```

---

## Bridge Actions

### Builder Bridge (`lib/actions/builder-bridge.ts`)

Connects session management to core builder functions:

#### `suggestTemplates(sessionId: string)`
- Retrieves client problem statement from database
- Calls core `selectTemplate()` function
- Returns ranked template suggestions with confidence scores

#### `initializeSelectedTemplate(sessionId, templateNumber, projectName)`
- Fetches session context
- Calls core `initializeProject()` to clone and configure template
- Returns project path and setup status

#### `getBuilderProgress(sessionId: string)`
- Transforms session data to `BuilderSession` format
- Calls core `trackProgress()` to calculate time remaining
- Returns progress status (timeElapsed, timeRemaining, onTrack)

#### `sendBuilderStatus(sessionId, type, context?)`
- Generates status messages for facilitator communication
- Types: 'update' | 'question' | 'ready' | 'blocker'
- Returns formatted message with emoji indicators

#### `generateDemoScript(sessionId: string)`
- Combines session data, client requirements, and customizations
- Calls core `prepareDemoScript()` function
- Returns structured 4-section demo script

### Facilitator Bridge (`lib/actions/facilitator-bridge.ts`)

Connects session management to core facilitator functions:

#### `generateDiscoveryQuestionsForSession(sessionId, context?)`
- Optionally fetches client industry from database
- Calls core `generateDiscoveryQuestions()` function
- Returns tailored questions for discovery phase

#### `excavateSessionProblem(sessionId: string)`
- Transforms clientInfo to `DiscoverySession` format
- Calls core `excavateProblem()` function
- Returns comprehensive `ProblemProfile` with stakeholders, requirements, ROI

#### `planSessionEngagement(sessionId, options?)`
- Gets problem profile from excavation
- Calls core `planEngagementActivities()` function
- Returns 5 time-boxed engagement activities (30 min total)

#### `orchestrateSessionDemo(sessionId: string)`
- Combines builder demo script with problem profile
- Calls core `orchestrateDemo()` function
- Returns demo flow with value translations and interaction points

#### `generateSessionFollowUp(sessionId: string)`
- Transforms session + demo data to `DiscoverySession` format
- Calls core `generateFollowUp()` function
- Returns personalized follow-up email with ROI, next steps, pricing

---

## Database Schema

### Core Tables (5)

1. **sessions** - Main session tracking
   - role (builder | facilitator)
   - status (active | paused | completed)
   - currentPhase (discovery | build | demo)
   - timing (startedAt, pausedAt, completedAt, totalPausedDuration)

2. **sessionSteps** - Phase-specific checklist items
   - step, description, phase, estimatedDuration
   - status (pending | in_progress | completed | skipped)
   - completedAt, timeSpent

3. **clientInfo** - Discovery phase data
   - clientName, problemStatement, currentState
   - threeWins (Three Wins framework)
   - mustHaveFeatures, niceToHaveFeatures
   - painPoints, targetUsers, decisionMaker
   - existingIntegrations, budget, timeline

4. **templateSelections** - Templates evaluated and selected
   - templateNumber, templateName, fit score (1-10)
   - reasoning, selected (boolean)
   - customizationNotes, customLogic, projectPath

5. **sessionNotes** - Free-form notes with tags
   - content, category (general | blocker | idea | decision)
   - tags, actionItem

---

## UI Components

### Implemented ✅

1. **SessionDashboard** - Main orchestrator with real-time updates
2. **SessionTimer** - Color-coded countdown with overtime detection
3. **StepChecklist** - Phase-filtered progress tracker
4. **ClientInfoForm** - Three Wins framework data capture
5. **TemplateSelector** - AI-suggested template browsing

### Integration Needed 🔄

These components exist but need to call the bridge actions:

- SessionDashboard → call `getBuilderProgress()` or `planSessionEngagement()`
- TemplateSelector → call `suggestTemplates()` and `initializeSelectedTemplate()`
- ClientInfoForm → call `excavateSessionProblem()` after save
- Demo components → call `generateDemoScript()` and `orchestrateSessionDemo()`

---

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add: DATABASE_URL, NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, CLERK_SECRET_KEY

# Run database migrations
npm run db:push

# Run tests
npm test

# Start development server
npm run dev
```

---

## Testing

```bash
# Run all tests (schema + actions + components)
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

**Test Coverage:**
- Schema tests: 16 suites
- Action tests: 47 test cases
- Component tests: 5 components
- **Total:** ~1,200 lines of tests

---

## Integration with Core Functions

The bridge layer enables the session assistant UI to leverage the battle-tested core functions:

### Builder Workflow
```typescript
// 1. Discovery: Suggest templates
const templates = await suggestTemplates(sessionId)

// 2. Setup: Initialize project
const project = await initializeSelectedTemplate(sessionId, 16, 'client-demo')

// 3. Build: Track progress
const progress = await getBuilderProgress(sessionId)

// 4. Demo: Generate script
const script = await generateDemoScript(sessionId)
```

### Facilitator Workflow
```typescript
// 1. Discovery: Generate questions
const questions = await generateDiscoveryQuestionsForSession(sessionId)

// 2. Excavation: Build problem profile
const profile = await excavateSessionProblem(sessionId)

// 3. Engagement: Plan activities
const plan = await planSessionEngagement(sessionId, { duration: 30 })

// 4. Demo: Orchestrate presentation
const demo = await orchestrateSessionDemo(sessionId)

// 5. Follow-up: Generate email
const email = await generateSessionFollowUp(sessionId)
```

---

## Next Steps

### Phase 1: Complete Pages & Routing (3-4 hours)

1. **Create Next.js App Router Structure**
   - [ ] `app/page.tsx` - Landing page
   - [ ] `app/session/new/page.tsx` - Create session
   - [ ] `app/session/[id]/page.tsx` - Session dashboard
   - [ ] `app/session/[id]/client-info/page.tsx` - Discovery phase
   - [ ] `app/session/[id]/templates/page.tsx` - Template selection
   - [ ] `app/session/[id]/demo/page.tsx` - Demo script view

2. **Connect Components to Bridge Actions**
   - [ ] Update TemplateSelector to call `suggestTemplates()`
   - [ ] Update ClientInfoForm to call `excavateSessionProblem()` on save
   - [ ] Create demo view that calls `generateDemoScript()` and `orchestrateSessionDemo()`
   - [ ] Add progress tracking that calls `getBuilderProgress()`

3. **Add AI Features**
   - [ ] Template recommendation based on problem statement
   - [ ] Auto-fill Three Wins suggestions
   - [ ] Smart customization notes generation
   - [ ] Session summary generation

### Phase 2: Polish & Deploy (2 hours)

- [ ] Add loading states and error handling
- [ ] Responsive design refinements
- [ ] E2E tests with Playwright
- [ ] Deploy to Vercel
- [ ] Configure production environment

---

## Key Design Principles

1. **Separation of Concerns**
   - Core functions (`lib/`) - Pure business logic
   - Bridge actions (`app/lib/actions/`) - Data transformation & DB queries
   - UI components (`app/components/`) - Presentation only

2. **Test-Driven Development**
   - Tests written first
   - 100% coverage on critical paths
   - Tests serve as living documentation

3. **Type Safety**
   - Full TypeScript throughout
   - No `any` types
   - Comprehensive interfaces

4. **Real-World Validated**
   - Built from actual 50-minute demo experience
   - Incorporates lessons from Template #16 build
   - Reflects real client engagement patterns

---

## Contributing

When adding features:
1. Write tests first (TDD)
2. Use bridge pattern (don't call core functions directly from UI)
3. Update type definitions
4. Add usage examples to README

---

**Built with TDD. Battle-tested. Ready to orchestrate rapid prototyping.**
