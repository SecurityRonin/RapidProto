# Dual-Mode RapidProto Design

## Overview

RapidProto is a 50-minute sprint timer for a builder-facilitator team working with a client. Two people, same sprint, different roles, synchronized timer.

## User Roles

### Builder
Technical implementer who codes the prototype.
- Works all 3 phases: Discovery (10 min) → Build (30 min) → Verify (10 min)
- Creates the session and shares code/link with facilitator

### Facilitator
Business lead who manages client expectations and closes deals.
- Primarily active during Build phase (30 min) while builder codes
- Has own 3-stage conversation flow within the Build phase

## User Flow

1. **Builder starts session** → Gets 6-character session code (e.g., `ABC123`)
2. **Builder shares code** → Via URL (`/session/abc123`) or verbal code
3. **Facilitator joins** → Enters code at `/join` or uses direct URL
4. **Both work in parallel** with synchronized timer
5. **Inputs sync bidirectionally** → Builder's discoveries visible to facilitator, and vice versa
6. **Session ends** → Both see completion summary

## Session Code

- 6 alphanumeric characters (easy to read aloud)
- Used in URL: `/session/abc123`
- Expires after 24 hours
- One builder + one facilitator per session

---

## Builder's Checklist

### Phase 1: Discovery (10 min)
- [ ] **Define core feature** - What's the ONE thing this prototype must do?
- [ ] **Pick a template** - Choose starting point that gets closest
- [ ] **List required changes** - What needs to be added/modified?

### Phase 2: Build (30 min)
- [ ] **Set up project** - Clone template, install dependencies
- [ ] **Implement core feature** - Build the main functionality
- [ ] **Style and polish** - Make it presentable

### Phase 3: Verify (10 min)
- [ ] **Test the happy path** - Does the core feature work?
- [ ] **Fix critical bugs** - Only blockers, skip nice-to-haves
- [ ] **Ship or screenshot** - Deploy it or capture evidence

---

## Facilitator's Checklist

Active during builder's Build phase (30 min total).

### Stage 1: Manage Expectations (~10 min)
- [ ] **Define prototype scope** - "Today's demo will show [X, Y, Z]"
- [ ] **Clarify what's out of scope** - "We won't be covering [A, B, C] today"
- [ ] **Set success criteria** - "What would make this demo a win for you?"
- [ ] **Explain technical limitations** - "Some parts will be mocked/simulated"

### Stage 2: Discuss Long Term (~10 min)
- [ ] **Feature roadmap** - "After the prototype, what features matter most?"
- [ ] **Priority order** - "If you had to pick the top 3 for v1..."
- [ ] **Timeline expectations** - "When would you ideally launch the full product?"
- [ ] **Key milestones** - "What checkpoints matter to you along the way?"
- [ ] **Ongoing relationship** - "How do you see us working together after launch?"

### Stage 3: Close the Deal (~10 min)
- [ ] **Pricing discussion** - "Let me walk you through our pricing structure"
- [ ] **Package options** - "Here's what's included at each tier"
- [ ] **Licensing & ownership** - "You'll own 100% of the code / Here's how IP works"
- [ ] **Next steps** - "If the demo goes well, here's what happens next"
- [ ] **Commitment/deposit** - "To move forward, we'd need [X]"

---

## UI Screens

### Landing Page (`/`)
- "Start as Builder" button → Creates session, redirects to `/session/[id]`
- "Join as Facilitator" button → Goes to `/join`

### Join Page (`/join`)
- Session code input field
- "Join Session" button → Validates code, redirects to `/session/[id]`

### Session Dashboard (`/session/[id]`)
Renders role-appropriate view based on how user joined.

**Builder View:**
```
┌─────────────────────────────────────────┐
│ RapidProto          [ABC-123]  [active] │
├─────────────────────────────────────────┤
│                                         │
│              08:42                      │
│         ━━━━━━━━━━━━░░░░               │
│    ● Discovery  ○ Build  ○ Verify      │
│                                         │
│         [Pause]  [Start Build →]        │
├─────────────────────────────────────────┤
│ DISCOVERY STEPS                         │
│ ☑ Define core feature                   │
│ ☐ Pick a template                       │
│ ☐ List required changes                 │
├─────────────────────────────────────────┤
│ 👤 Facilitator joined                   │
│ (syncing inputs...)                     │
└─────────────────────────────────────────┘
```

**Facilitator View:**
```
┌─────────────────────────────────────────┐
│ RapidProto          [ABC-123]  [active] │
├─────────────────────────────────────────┤
│                                         │
│              24:18                      │
│         ━━━━━━━━░░░░░░░░░░             │
│   ○ Expectations  ○ Long Term  ○ Close │
│                                         │
├─────────────────────────────────────────┤
│ FROM BUILDER (Discovery)                │
│ • Core feature: "User login with OAuth" │
│ • Template: "Next.js SaaS starter"      │
├─────────────────────────────────────────┤
│ MANAGE EXPECTATIONS                     │
│ ☑ Define prototype scope                │
│ ☐ Clarify out of scope                  │
│ ☐ Set success criteria                  │
│ ☐ Explain technical limitations         │
└─────────────────────────────────────────┘
```

---

## Data Model

### Session Table
```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,              -- 6-char code (ABC123)
  status TEXT DEFAULT 'active',     -- active | paused | completed
  current_phase TEXT DEFAULT 'discovery',
  phase_started_at INTEGER,
  started_at INTEGER,
  paused_at INTEGER,
  completed_at INTEGER,
  total_paused_time INTEGER DEFAULT 0,
  session_title TEXT,
  builder_joined INTEGER DEFAULT 0,
  facilitator_joined INTEGER DEFAULT 0,
  discovery_duration INTEGER DEFAULT 10,
  build_duration INTEGER DEFAULT 30,
  demo_duration INTEGER DEFAULT 10,
  created_at INTEGER,
  updated_at INTEGER,
  expires_at INTEGER                -- 24h TTL
);
```

### Session Steps Table
```sql
CREATE TABLE session_steps (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  role TEXT,                        -- 'builder' | 'facilitator'
  phase TEXT,                       -- 'discovery' | 'build' | 'demo' (builder)
                                    -- 'expectations' | 'longterm' | 'close' (facilitator)
  step_number INTEGER,
  title TEXT,
  description TEXT,
  estimated_minutes INTEGER,
  status TEXT DEFAULT 'pending',    -- pending | in_progress | completed | skipped
  acquired_value TEXT,              -- Input/answer captured (syncs to other role)
  notes TEXT,
  started_at INTEGER,
  completed_at INTEGER,
  created_at INTEGER
);
```

---

## API Routes

```
POST /api/session              - Create session (builder)
GET  /api/session/[id]         - Get session state (polling, both roles)
POST /api/session/[id]/join    - Join as facilitator
POST /api/session/[id]/step    - Update step status/acquired value
POST /api/session/[id]/pause   - Pause timer
POST /api/session/[id]/resume  - Resume timer
POST /api/session/[id]/advance - Move to next phase
POST /api/session/[id]/complete - Complete session
```

---

## Sync Mechanism

- Both clients poll `GET /api/session/[id]` every 2 seconds
- Response includes:
  - Timer state (phase, elapsed time, status)
  - All steps for requesting role
  - Acquired values from other role (for display in "synced inputs" section)
- Writes update immediately, next poll picks up changes

---

## Technical Stack

- **Framework:** Next.js 14 (App Router)
- **Database:** Turso (LibSQL) - cloud SQLite
- **UI:** shadcn/ui components
- **Sync:** Polling (2-second interval)
- **Deployment:** Vercel

---

## Implementation Tasks

1. Set up Turso cloud database + env vars in Vercel
2. Update database schema with dual-role support
3. Create API routes for session management
4. Implement session creation flow (builder)
5. Implement session join flow (facilitator)
6. Build role-aware dashboard component
7. Add bidirectional input sync display
8. Update landing page with role selection
9. Add session code display and copy functionality
10. Write tests for all flows

---

## Future Enhancements (Not in Scope)

- Real-time WebSocket sync (reduce polling latency)
- Multiple facilitators per session
- Session history and analytics
- Template library integration
- Audio/video communication built-in
