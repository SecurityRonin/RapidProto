# RapidProto UI Redesign with shadcn/ui

**Date:** 2026-01-25
**Author:** Design Session with User
**Status:** Validated Design - Ready for Implementation

---

## Executive Summary

Redesign RapidProto's builder and facilitator UI using shadcn/ui components to improve accessibility, keyboard navigation, and visual consistency. The design serves expert consultants and builders who execute 50-minute MVP sessions.

**Key Decisions:**
- Split-pane layout (timer always visible)
- Color theming for role differentiation (blue=builder, purple=facilitator)
- Soft overflow timer (ambient pressure without interruption)
- Dropdown menus for step actions (prevents mistakes)
- Badge-based AI suggestions (fast trust-building)
- All-visible form layout (respects expert users)

---

## Architecture

### Component Hierarchy

```
SessionLayout (split-pane container)
├── LeftPane (fixed 320px)
│   ├── SessionHeader (role badge, client name)
│   ├── LiveTimer (countdown with color states)
│   ├── PhaseProgress (3-phase stepper: Discovery → Build → Demo)
│   └── QuickActions (pause/resume, advance, complete)
│
└── RightPane (flexible)
    ├── TabNavigation (Steps, Client Info, Templates, Demo)
    └── TabContent
        ├── StepsTab → StepChecklist
        ├── ClientTab → ClientInfoForm
        ├── TemplatesTab → TemplateSelector
        └── DemoTab → DemoScriptView
```

### shadcn/ui Components Required

Install these components via `npx shadcn-ui@latest add <component>`:

- **Core:** `Button`, `Card`, `Badge`, `Separator`, `Tabs`
- **Forms:** `Input`, `Label`, `Textarea`
- **Navigation:** `DropdownMenu`, `Tooltip`
- **Feedback:** `Progress`, `Alert`
- **Advanced:** `Collapsible`, `Dialog`

### Theme Configuration

Use CSS variables for runtime role switching:

```css
/* Builder theme */
--primary: 217 91% 60%; /* blue-500 */
--primary-foreground: 0 0% 100%;

/* Facilitator theme */
--primary: 271 91% 65%; /* purple-500 */
--primary-foreground: 0 0% 100%;
```

Apply theme via data attribute: `<div data-role="builder">` or `<div data-role="facilitator">`.

---

## Component Designs

### 1. LiveTimer Component

**Purpose:** Display countdown, phase progress, and quick controls.

**Layout:**
```
┌─────────────────────────────┐
│  Discovery Phase            │
│  ━━━━━━━━━━░░░░░░░░░ 65%   │
│                             │
│        12:34                │
│     4 min remaining         │
│                             │
│  [⏸ Pause]  [⏭ Next Phase] │
└─────────────────────────────┘
```

**Color States:**
- Green (>50% remaining): Normal state
- Yellow (20-50%): Amber warning
- Orange (<20%): Pulsing urgency
- Red (overtime): Shows "+02:34 over", urgent pulse

**Implementation Details:**
- `useInterval(1000)` for countdown
- `Progress` component for visual bar
- `Badge` for phase name (role-themed color)
- `Button` variants: ghost (pause), default (advance)
- Accessibility: `aria-live="polite"`, updates every 30s

**Keyboard Shortcuts:**
- `Space`: Pause/resume
- `→`: Advance phase

**Compact Mode:** Hides quick actions on small screens, timer remains visible.

---

### 2. StepChecklist Component

**Purpose:** Track task progress with deliberate actions and time tracking.

**Layout:**
```
┌─────────────────────────────────────────┐
│ Discovery Phase (3/3 complete) ⏱ 9:45  │
├─────────────────────────────────────────┤
│ ✓ Review client requirements      3min │
│ ⟳ Select template            [⋮]  2min │
│ ○ Plan customizations        [⋮]  3min │
└─────────────────────────────────────────┘
```

**Step States:**
- Pending: `○` (gray circle)
- In Progress: `⟳` (rotating icon, role color)
- Completed: `✓` (green check, strikethrough)
- Skipped: `⊘` (gray slash, dimmed)

**Dropdown Menu (on `[⋮]` click):**
```
┌──────────────────┐
│ ▶ Start          │
│ ✓ Complete       │
│ ⊘ Skip           │
│ ──────────────   │
│ 📝 Add Note      │
│ 📊 View Details  │
└──────────────────┘
```

**Keyboard Navigation:**
- `j/k`: Navigate steps
- `Space`: Open menu
- `c`: Complete current step
- `s`: Skip current step

**Features:**
- Auto-advance: Completing one step starts the next (optional)
- Time tracking: Badge shows estimated vs actual (green if under, yellow if over)
- Bulk actions: Shift+click to select multiple steps

**Implementation:**
- `DropdownMenu` with keyboard support
- `Badge` for time display
- `Collapsible` for step details (notes, substeps)
- Polls `getSessionStatus()` every 5s for real-time updates

---

### 3. ClientInfoForm Component

**Purpose:** Capture discovery data using Three Wins framework.

**Layout (all-visible, keyboard-optimized):**
```
┌─────────────────────────────────────────────┐
│ Client Discovery                            │
├─────────────────────────────────────────────┤
│ Basic Info                                  │
│ ┌─────────────────┐ ┌────────────────────┐ │
│ │ Client Name *   │ │ Industry           │ │
│ └─────────────────┘ └────────────────────┘ │
│                                             │
│ Three Wins Framework                        │
│ 1. [________________________]               │
│ 2. [________________________]               │
│ 3. [________________________]               │
│                                             │
│ Pain Points              [+ Add] Cmd+Shift+P│
│ • [________________________] [×]            │
│ • [________________________] [×]            │
│                                             │
│ Must-Have Features       [+ Add] Cmd+Shift+M│
│ • [________________________] [×]            │
│                                             │
│ Nice-to-Have Features    [+ Add] Cmd+Shift+N│
│ • [________________________] [×]            │
│                                             │
│ Budget & Timeline                           │
│ ┌──────────┐ ┌───────────────────────────┐ │
│ │ $25,000  │ │ Need to start in 2 weeks  │ │
│ └──────────┘ └───────────────────────────┘ │
│                                             │
│ ✓ Auto-saved 2s ago        [Save] Cmd+Enter│
└─────────────────────────────────────────────┘
```

**Keyboard Shortcuts:**
- `Tab/Shift+Tab`: Flow through fields
- `Cmd+Enter`: Force save
- `Cmd+Shift+P/M/N`: Add pain point/must-have/nice-to-have
- `Escape`: Clear current field

**Auto-Save:**
- Debounced 2s after last keystroke
- `Badge` shows "Saving..." then "Saved 2s ago"
- Validation on blur (red border + error text)

**Expert Features:**
- Paste multiline text into Three Wins → auto-splits into 3 fields
- Drag to reorder pain points/features
- Focus auto-moves to new field when adding items

**Implementation:**
- `Input` + `Label` for all fields
- `Button` (ghost) for add/remove actions
- `Card` wrapper for form
- `Badge` for auto-save indicator

---

### 4. TemplateSelector Component

**Purpose:** Browse templates with AI-powered suggestions.

**Layout (grid with badges):**
```
┌──────────────────────────────────────────────────┐
│ 🔍 Search templates...        [Category ▾] [⚡ AI]│
├──────────────────────────────────────────────────┤
│ ┌──────────────┐ ┌──────────────┐ ┌────────────┐│
│ │ 🏆 Best Match│ │ High Fit 85% │ │ Good Fit   ││
│ │ Template #16 │ │ Template #8  │ │ Template #2││
│ │              │ │              │ │            ││
│ │ Client Intake│ │ Lead Tracker │ │ Invoice Gen││
│ │ ⭐⭐⭐ 30min │ │ ⭐⭐ 25min   │ │ ⭐ 20min   ││
│ │              │ │              │ │            ││
│ │ [Select]     │ │ [Select]     │ │ [Select]   ││
│ └──────────────┘ └──────────────┘ └────────────┘│
└──────────────────────────────────────────────────┘
```

**Badge System:**
- 🏆 **Best Match** (gold): >90% confidence
- **High Fit XX%** (green): 75-89%
- **Good Fit** (blue): 60-74%
- Hover shows `Tooltip` with AI reasoning

**Card Content:**
- Template name + category
- Complexity stars (⭐⭐⭐)
- Estimated build time
- `Button`: primary for "Select", outline for "Preview"

**Filtering:**
- `Input` with search (filters by name, keywords, category)
- `DropdownMenu` for category filter
- `Badge` for active filters (removable)
- AI toggle: Shows all vs. only top 5 AI-suggested

**Selection Flow:**
```
Click [Select] →
┌────────────────────────────────────┐
│ Initialize Template #16?           │
│                                    │
│ Project name: [acme-client-intake] │
│                                    │
│ Customizations needed:             │
│ • AI document extraction           │
│ • Conflict checking                │
│ • Salesforce integration           │
│                                    │
│ [Cancel]  [Initialize Project]     │
└────────────────────────────────────┘
```

**Implementation:**
- Calls `suggestTemplates(sessionId)` for AI matches
- Calls `initializeSelectedTemplate()` on confirm
- `Tooltip` for AI reasoning on badge hover
- `Dialog` for initialization confirmation

---

### 5. DemoScriptView Component

**Purpose:** Present demo script with section tracking.

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Demo Script - Acme Client Intake    [Present] │
├────────────────────────────────────────────────┤
│ 1. Context Setting (1 min)              ○ Not │
│    → Remind problem: "Manual client intake"   │
│    → Set expectations: "Working prototype"    │
│    [✓ Start Section]                          │
│                                                │
│ 2. Happy Path (3 min)                   ⟳ Live│
│    ✓ Upload PDF intake form                   │
│    ✓ Auto-extract client details              │
│    → Check for conflicts                      │
│    → Export to Salesforce                     │
│    [⏸ Pause] [✓ Complete Section]            │
│                                                │
│ 3. Edge Cases (2 min)                    ○ Not │
│    • Duplicate client detection               │
│    • Partial PDF data extraction              │
│    [✓ Start Section]                          │
│                                                │
│ 4. Future State (1 min)                  ○ Not │
│    💡 Next: QuickBooks integration            │
│    💡 Mobile app for field attorneys          │
│    [✓ Start Section]                          │
│                                                │
│ Total: 7 minutes | Completed: 1/4 sections    │
└────────────────────────────────────────────────┘
```

**Presentation Mode:**
- Click `[Present]` → Full-screen overlay
- Large text, high contrast (screen-sharing optimized)
- Timer per section
- `Space` to advance substeps
- `Escape` to exit

**Role-Specific Panels:**
- **Builder**: Technical highlights (right side)
  - "Using Vercel AI SDK"
  - "Drizzle ORM with fuzzy matching"
- **Facilitator**: Value translations
  - "Upload PDF → Saves 5 hours/week"
  - "Auto conflict check → Prevents malpractice risk"

**Implementation:**
- `Card` for each section with `Collapsible` details
- `Badge` for section status (Not Started / Live / Done)
- `Progress` bar for overall completion
- `Alert` for "Future State" section (info variant)
- Calls `generateDemoScript(sessionId)` to populate
- Calls `orchestrateSessionDemo(sessionId)` for value translations

---

## Data Flow

### Integration with Bridge Actions

**On component mount:**
1. `SessionLayout` calls `getSessionStatus(sessionId)` every 5s
2. Distributes session data to child components via props

**User actions trigger bridge calls:**
- `TemplateSelector` → `suggestTemplates()` → displays AI matches
- `TemplateSelector` (on select) → `initializeSelectedTemplate()` → creates project
- `ClientInfoForm` (auto-save) → `saveClientInfo()` → persists to DB
- `ClientInfoForm` (on blur) → `excavateSessionProblem()` → validates completeness
- `DemoScriptView` (on load) → `generateDemoScript()` + `orchestrateSessionDemo()`
- `LiveTimer` actions → `pauseSession()`, `resumeSession()`, `advancePhase()`
- `StepChecklist` menu → `updateStep(stepId, status)`

**Real-time updates:**
- Poll `getSessionStatus()` every 5s
- Update timer, phase progress, step states
- No websockets needed for 50-minute sessions

---

## Implementation Plan

### Phase 1: Setup shadcn/ui (30 min)

1. Initialize shadcn/ui:
   ```bash
   cd app
   npx shadcn-ui@latest init
   ```
   - Choose: New York style, Zinc color, CSS variables

2. Install required components:
   ```bash
   npx shadcn-ui@latest add button card badge separator tabs
   npx shadcn-ui@latest add input label textarea
   npx shadcn-ui@latest add dropdown-menu tooltip
   npx shadcn-ui@latest add progress alert collapsible dialog
   ```

3. Configure theme switching:
   - Create `lib/theme.ts` with `setRole(role: 'builder' | 'facilitator')`
   - Update CSS variables in `app/globals.css`

### Phase 2: Refactor Existing Components (2-3 hours)

**Priority order:**
1. `SessionLayout` - Split-pane container with theme context
2. `LiveTimer` - Replace with `Progress` + `Badge` + `Button`
3. `StepChecklist` - Replace with `DropdownMenu` + `Badge`
4. `ClientInfoForm` - Replace inputs with `Input` + `Label`
5. `TemplateSelector` - Add `Card` + `Tooltip` for AI badges
6. `DemoScriptView` - Use `Collapsible` + `Alert`

**For each component:**
- Keep existing logic (state, effects, handlers)
- Replace HTML elements with shadcn/ui components
- Add keyboard shortcuts
- Update tests to use new component structure

### Phase 3: Add New Features (1-2 hours)

- Presentation mode for `DemoScriptView`
- Bulk actions for `StepChecklist`
- Auto-split paste for `ClientInfoForm`
- Keyboard navigation for all components

### Phase 4: Testing & Polish (1 hour)

- Update component tests
- Test keyboard navigation
- Verify accessibility (screen reader, focus management)
- Mobile responsiveness check

---

## Success Metrics

**Accessibility:**
- All interactive elements keyboard-navigable
- ARIA labels on all controls
- Focus indicators visible
- Screen reader tested

**Performance:**
- Timer updates smoothly (60fps)
- Auto-save doesn't block typing
- 5s polling doesn't cause jank

**Usability:**
- Expert users complete discovery in <10 min
- Zero accidental step completions
- AI suggestions trusted (>80% select top match)

---

## Future Enhancements

- Dark mode support (shadcn/ui built-in)
- Custom keyboard shortcut configuration
- Offline mode with local storage sync
- Multi-session comparison view
- Export demo script to PDF

---

## Appendix: Component Props

### SessionLayout
```typescript
interface SessionLayoutProps {
  sessionId: string
  role: 'builder' | 'facilitator'
  children: React.ReactNode
}
```

### LiveTimer
```typescript
interface LiveTimerProps {
  sessionId: string
  phase: 'discovery' | 'build' | 'demo'
  timeRemaining: number
  status: 'active' | 'paused' | 'completed'
  onPause: () => void
  onResume: () => void
  onAdvance: () => void
  compact?: boolean
}
```

### StepChecklist
```typescript
interface StepChecklistProps {
  sessionId: string
  phase: 'discovery' | 'build' | 'demo'
  steps: Step[]
  onUpdateStep: (stepId: string, status: StepStatus) => void
}

interface Step {
  id: string
  step: string
  description?: string
  estimatedDuration: number
  status: 'pending' | 'in_progress' | 'completed' | 'skipped'
  timeSpent?: number
}
```

### ClientInfoForm
```typescript
interface ClientInfoFormProps {
  sessionId: string
  initialData?: Partial<ClientInfo>
  onSave?: (data: ClientInfo) => void
  autoSave?: boolean
}
```

### TemplateSelector
```typescript
interface TemplateSelectorProps {
  sessionId: string
  onSelect: (templateNumber: number) => void
  aiSuggestionsOnly?: boolean
}
```

### DemoScriptView
```typescript
interface DemoScriptViewProps {
  sessionId: string
  role: 'builder' | 'facilitator'
  presentationMode?: boolean
}
```

---

**Design validated:** 2026-01-25
**Ready for implementation**
