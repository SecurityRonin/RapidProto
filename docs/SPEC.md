# RapidProto: Product Specification

**Version:** 1.0
**Date:** 2026-01-29
**Status:** Reverse-engineered from implementation

---

## 1. Overview

### 1.1 Problem Statement

Software consultants conducting rapid prototyping sessions face coordination challenges:
- Builder needs focused coding time without client interruption
- Facilitator handles client conversations but loses track of build progress
- Both need synchronized time awareness without constant communication
- Session artifacts are lost without structured capture

### 1.2 Solution

A synchronized session timer application that provides:
- Parallel workflows for builder and facilitator roles
- Real-time timer synchronization via shared session codes
- Guided checklists for each role's responsibilities
- Session history and export for follow-up

### 1.3 Target Users

| Role | Description |
|------|-------------|
| **Builder** | Developer coding the prototype during the session |
| **Facilitator** | Consultant managing client expectations and business discussions |

---

## 2. Core Features

### 2.1 Session Management

#### 2.1.1 Session Creation (Builder)
- Builder creates a new session with optional project name
- System generates unique 6-character alphanumeric code
- Session stored in Turso database for cross-device sync
- Local copy in localStorage for offline resilience

#### 2.1.2 Session Joining (Facilitator)
- Facilitator enters 6-character code to join existing session
- Timer synchronizes with builder's session state
- Role stored in localStorage per session

#### 2.1.3 Practice Mode (Facilitator)
- Solo practice without builder
- Creates local-only session
- Full facilitator workflow available

### 2.2 Timer System

#### 2.2.1 Phase Structure
Total session: **50 minutes**

| Phase | Duration | Builder Focus | Facilitator Focus |
|-------|----------|---------------|-------------------|
| Discovery | 10 min | Define scope, pick template | Waiting |
| Build | 30 min | Code the prototype | Expectations, Long Term, Close |
| Demo/Verify | 10 min | Test and ship | Demo together |

#### 2.2.2 Timer Features
- Real-time countdown synchronized across participants
- Pause/Resume functionality
- Visual warnings at thresholds:
  - 5 minutes: Yellow highlight
  - 1 minute: Red + "1 MIN LEFT" badge
  - 10 seconds: Pulsing red urgency
- Audio notifications (optional)

#### 2.2.3 Phase Navigation
- Forward: Advance to next phase/stage
- Backward: Return to previous phase/stage (both roles)
- Manual advancement independent of timer

### 2.3 Role-Based Workflows

#### 2.3.1 Builder Phases

**Discovery (10 min)**
1. Define the core feature - What ONE thing must the prototype do?
2. Pick a template - Choose closest starting point
3. List required changes - What to add/modify?

**Build (30 min)**
1. Set up the project - Clone, install dependencies
2. Implement core feature - Build main functionality
3. Style and polish - Make presentable

**Demo/Verify (10 min)**
1. Test the happy path - Does core feature work?
2. Fix critical bugs - Blockers only
3. Ship or screenshot - Deploy or capture evidence

#### 2.3.2 Facilitator Stages

**Expectations Stage**
1. Define prototype scope - What demo covers
2. Clarify out of scope - What's excluded
3. Set success criteria - Client's win condition
4. Explain technical limitations - Mocked/simulated parts

**Long Term Stage**
1. Feature roadmap - Post-prototype priorities
2. Priority order - Top 3 for v1
3. Timeline expectations - Ideal launch date
4. Ongoing relationship - Future collaboration

**Close Stage**
1. Pricing discussion - Structure overview
2. Package options - Tier breakdown
3. Next steps - Post-demo process
4. Commitment/deposit - Required to proceed

### 2.4 Step Checklist System

#### 2.4.1 Step Properties
- Title and description
- Estimated duration
- Status: pending | completed | skipped
- Acquired value (captured response/decision)
- Notes field

#### 2.4.2 Step Interactions
- Expand/collapse for details
- Mark complete with optional value capture
- Skip with reason
- Add notes at any time
- **Autosave**: 1500ms debounce after typing

### 2.5 Synced Inputs (Facilitator → Builder)

Facilitator captures client decisions that sync to builder's view:
- Core Feature
- Template choice
- Required Changes
- Prototype Scope
- Out of Scope items
- Success Criteria

### 2.6 Session History & Export

#### 2.6.1 History Display
- Recent sessions on landing page
- Expandable details per session
- Key decisions summary
- Step completion count

#### 2.6.2 Export Formats

**Markdown Export**
- Human-readable session summary
- Grouped by phase/stage
- Includes all captured values and notes
- Timestamped with duration

**JSON Export**
- Machine-readable data
- Full session metadata
- All steps with status and values
- Suitable for programmatic processing

### 2.7 Keyboard Shortcuts

| Key | Action | Condition |
|-----|--------|-----------|
| `Space` | Pause/Resume | Session active or paused |
| `→` | Advance phase/stage | Can advance |
| `←` | Go back phase/stage | Not at first phase/stage |
| `Esc` | Clear focus | Always |

- Shortcuts disabled when typing in inputs
- Persistent enable/disable preference
- Visual hints on buttons when enabled

---

## 3. Technical Architecture

### 3.1 Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| UI Components | shadcn/ui + Tailwind CSS |
| Database | Turso (SQLite at edge) |
| ORM | Drizzle |
| Deployment | Vercel |
| State | React hooks + localStorage hybrid |

### 3.2 Data Model

#### Session
```typescript
interface Session {
  id: string                    // 6-char code
  status: 'active' | 'paused' | 'completed'
  currentPhase: 'discovery' | 'build' | 'demo'
  facilitatorStage: 'expectations' | 'longterm' | 'close'
  phaseStartedAt: Date
  startedAt: Date
  pausedAt: Date | null
  completedAt: Date | null
  totalPausedTime: number       // milliseconds
  sessionTitle: string | null
  builderJoined: boolean
  facilitatorJoined: boolean
  syncedInputs: SyncedInputs
  steps: SessionStep[]
  // Phase durations (configurable)
  discoveryDuration: number     // minutes
  buildDuration: number
  demoDuration: number
}
```

#### SessionStep
```typescript
interface SessionStep {
  id: string
  sessionId: string
  role: 'builder' | 'facilitator'
  phase: string
  stepNumber: number
  title: string
  description: string
  estimatedMinutes: number
  status: 'pending' | 'completed' | 'skipped'
  acquiredValue: string | null
  notes: string | null
  completedAt: Date | null
}
```

### 3.3 State Architecture

**Hybrid Local/Remote:**
- API creates session in Turso database
- Local copy in localStorage for fast reads
- Optimistic updates with server reconciliation
- Practice sessions: localStorage only

**Session Context:**
- React Context provides session state
- Custom hooks for timer, phase, actions
- Automatic refresh after mutations

### 3.4 API Routes

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/session` | POST | Create new session |
| `/api/session/[id]` | GET | Fetch session |
| `/api/session/[id]/join` | POST | Join as facilitator |
| `/api/session/[id]/pause` | POST | Pause timer |
| `/api/session/[id]/resume` | POST | Resume timer |
| `/api/session/[id]/advance` | POST | Advance phase |
| `/api/session/[id]/step` | PUT | Update step |
| `/api/session/[id]/complete` | POST | Complete session |

---

## 4. User Interface

### 4.1 Visual Design

**Role Differentiation:**
- Builder: Blue tint background
- Facilitator: Violet tint background
- Consistent across entry pages and dashboard

**Layout:**
- Sticky header with navigation and session info
- Centered content (max-width: 768px)
- Timer prominently displayed
- Controls below timer
- Checklist as main content

### 4.2 Components

| Component | Purpose |
|-----------|---------|
| `Logo` | Brand mark with configurable size |
| `TimerCard` | Countdown display with warning states |
| `SessionControls` | Pause/Resume/Back/Advance/Complete buttons |
| `StepChecklist` | Expandable step items with inputs |
| `SyncedInputsCard` | Display of facilitator-captured decisions |
| `SessionHistory` | List of completed sessions |
| `DashboardHeader` | Navigation and session metadata |

### 4.3 Responsive Design
- Mobile-first approach
- Adapts to screen width
- Touch-friendly controls
- Readable on all devices

---

## 5. PWA Support

### 5.1 Manifest
- Installable on mobile/desktop
- Custom icons (192px, 512px)
- Theme color: #f0b238 (gold)
- Background color: #0d0d1f (dark)

### 5.2 Icons
- Favicon (32px)
- Apple touch icon (180px)
- PWA icons (192px, 512px)
- SVG source for scaling

---

## 6. Testing

### 6.1 Test Coverage
- 475 unit tests
- Component tests with React Testing Library
- Hook tests for state management
- Action tests for business logic

### 6.2 Test Strategy
- Vitest as test runner
- Mock localStorage for storage tests
- Test both success and error paths
- Snapshot tests for critical UI

---

## 7. Future Considerations

### 7.1 Potential Enhancements
- Real-time WebSocket sync (currently polling)
- Multi-session support
- Team collaboration features
- Integration with project management tools
- AI-powered step suggestions
- Template library integration

### 7.2 Out of Scope (Current Version)
- User authentication/accounts
- Session sharing via link
- Video/audio communication
- File attachments
- Custom step templates

---

## 8. Success Metrics

| Metric | Target |
|--------|--------|
| Session completion rate | > 80% |
| Average session duration | 45-55 minutes |
| Export usage | > 50% of completed sessions |
| Return usage | > 3 sessions per user/month |

---

*This specification was reverse-engineered from the implemented RapidProto application to document its current functionality and design decisions.*
