# RapidProto Core Functions

TDD-built workflow orchestration for the 50-minute demo process.

## Overview

The RapidProto methodology requires two team members working in parallel:
- **Builder**: Executes the 30-minute live build
- **Facilitator**: Leads discovery, engages clients, and closes deals

These modules provide the core functions to orchestrate both roles.

---

## Builder Functions (`builder.ts`)

### Core Capabilities

#### 1. Template Selection
```typescript
const match = selectTemplate('We need client intake automation')
// Returns: Template #16 with confidence score and reasoning
```

- Analyzes problem description using keyword matching
- Returns best template match with confidence score
- Supports multiple suggestions for ambiguous problems
- Assesses build complexity and time estimates

#### 2. Project Initialization
```typescript
const result = await initializeProject({
  templateNumber: 16,
  projectName: 'acme-client-intake',
  clientName: 'Acme Corp',
  env: {
    PROJECT_NAME: 'Acme Client Intake',
    DATABASE_URL: 'file:./acme.db',
  },
})
// Clones template, configures environment, returns project path
```

- Clones template to new project directory
- Configures environment variables
- Updates package.json with project name
- Returns file count and configuration status

#### 3. Progress Tracking
```typescript
// Update session with phase completion
const updated = trackProgress(session, {
  name: 'Core Logic',
  startTime: new Date(),
  endTime: new Date(),
  status: 'completed',
})

// Get current progress status
const status = trackProgress(session)
// Returns: { timeElapsed: 15, timeRemaining: 15, onTrack: true }
```

- Tracks build phases and timing
- Calculates time remaining (30-minute target)
- Warns when running over time
- Suggests course corrections

#### 4. Status Communication
```typescript
// Send update to facilitator
const message = communicateStatus(session, 'update')
// "✅ Core Logic (15 min elapsed, 15 min remaining)"

// Request clarification
const question = communicateStatus(session, 'question', {
  question: 'What format is their expense data in?',
})

// Announce demo readiness
const ready = communicateStatus(session, 'ready')
// "🚀 Demo ready! Built in 28 minutes"
```

- Generates formatted status messages
- Supports update, question, ready, and blocker types
- Includes emoji indicators for quick scanning
- Flags urgent issues requiring immediate attention

#### 5. Demo Script Preparation
```typescript
const script = prepareDemoScript(session)
// Returns structured demo flow with:
// - Context setting (1 min)
// - Happy path demonstration (3 min)
// - Edge cases (2 min)
// - Future state discussion (1 min)
```

- Generates 4-section demo script
- Incorporates client requirements and edge cases
- Estimates timing for each section
- Includes technical highlights for reference

---

## Facilitator Functions (`facilitator.ts`)

### Core Capabilities

#### 1. Discovery Question Generation
```typescript
const questions = generateDiscoveryQuestions({ industry: 'legal' })
// Returns tailored questions for:
// - Surface problem
// - Current state
// - Success criteria (Three Wins framework)
// - Constraints
// - Edge cases
```

- Generates structured discovery questions
- Adapts to industry context (legal, healthcare, etc.)
- Customizes based on problem type (workflow, data, scheduling)
- Includes the "Three Wins" framework

#### 2. Problem Excavation
```typescript
const profile = excavateProblem(session)
// Returns comprehensive problem profile:
// - Problem statement
// - Current process and pain points
// - Success criteria
// - Stakeholders (users, decision makers)
// - Technical requirements
// - Business impact ($, volume, ROI)
// - Urgency and budget
// - Completeness check
```

- Extracts structured data from discovery responses
- Identifies stakeholders and decision makers
- Quantifies business impact and ROI potential
- Flags missing information for follow-up
- Assesses urgency and competitive threat

#### 3. Engagement Activity Planning
```typescript
const plan = planEngagementActivities(profile, { duration: 30 })
// Returns 5 activities totaling 30 minutes:
// 1. User Journey Mapping (5 min)
// 2. Data Deep Dive (5 min)
// 3. Integration Inventory (5 min)
// 4. Roadmap Planning (5 min)
// 5. Stakeholder Mapping (5 min)
```

- Plans 30-minute engagement schedule
- Adapts activities based on problem domain
- Adjusts for time constraints (15-30 min)
- Provides prompts and phases for each activity

#### 4. Demo Orchestration
```typescript
const orchestration = orchestrateDemo(builderScript, profile)
// Returns:
// - Demo flow with facilitator roles
// - Business value translations
// - Interaction points for client engagement
// - Narration style (technical vs. business-value)
```

- Maps demo sections to facilitator actions
- Translates technical features to business value
- Identifies moments for client interaction
- Adapts narration to technical level of audience

#### 5. Follow-Up Generation
```typescript
const followUp = generateFollowUp(session, demo)
// Returns personalized follow-up based on heat level:
// - Hot: Next steps and kickoff scheduling
// - Qualified: Pilot program proposal with pricing
// - Lukewarm: Resource sharing and nurture sequence
```

- Generates email subject and body
- Includes demo links and attachments
- Calculates ROI when data available
- Sets appropriate urgency level
- Creates calendar invites for next meetings

---

## Type Definitions

### Builder Types

```typescript
interface TemplateMatch {
  templateNumber: number
  templateName: string
  category: string
  confidence: number  // 0-1 score
  reasoning: string
  complexity: number  // 1-3 stars
  estimatedBuildTime: number  // minutes
}

interface BuilderSession {
  id: string
  templateNumber: number
  startTime: Date
  phases: BuildPhase[]
  currentPhase?: string
  demoReady?: boolean
  demoUrl?: string
  customizations?: string[]
  clientRequirements?: string[]
  testScenarios?: TestScenario[]
  edgeCases?: EdgeCase[]
  technicalHighlights?: string[]
}
```

### Facilitator Types

```typescript
interface ProblemProfile {
  problemStatement?: string
  currentProcess?: string
  painPoints?: string[]
  successCriteria?: string[]
  stakeholders: {
    users?: string[]
    decisionMaker?: string
    technicalLevel?: 'low' | 'medium' | 'high'
  }
  technicalRequirements: {
    integrations?: string[]
    compliance?: string[]
    dataFormat?: string
  }
  businessImpact: {
    monthlyCost?: number
    volume?: number
    roiPotential?: number
  }
  urgency?: 'low' | 'medium' | 'high'
  budget?: number
  complete?: boolean
  missingInformation?: string[]
}

interface FollowUpEmail {
  subject: string
  body: string
  nextSteps: string[]
  urgency: 'low' | 'medium' | 'high'
  pricingTiers?: PricingTier[]
  attachments: string[]
  links: {
    demoUrl?: string
    recordingUrl?: string
    codeRepo?: string
  }
  roiCalculation?: ROICalculation
  calendarInvite?: CalendarInvite
}
```

---

## Testing

All functions are built with **Test-Driven Development (TDD)**:

```bash
# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

**Test Coverage:**
- Builder functions: 20 tests
- Facilitator functions: 25 tests
- Total: 45 tests, 100% passing ✅

---

## Usage Examples

### Complete Builder Workflow

```typescript
import {
  selectTemplate,
  initializeProject,
  trackProgress,
  communicateStatus,
  prepareDemoScript,
} from './builder'

// 1. Discovery Phase (Minutes 0-10)
const match = selectTemplate(clientProblem)
console.log(`Recommended: Template #${match.templateNumber}`)

// 2. Setup Phase (Minutes 10-12)
const project = await initializeProject({
  templateNumber: match.templateNumber,
  projectName: 'client-demo',
  env: { PROJECT_NAME: 'Client Demo' },
})

// 3. Build Phase (Minutes 12-30)
let session: BuilderSession = {
  id: 'session_123',
  templateNumber: match.templateNumber,
  startTime: new Date(),
  phases: [],
}

// Track data model phase
session = trackProgress(session, {
  name: 'Data Model',
  startTime: new Date(),
  status: 'in-progress',
})

// Update facilitator
const update = communicateStatus(session, 'update')
console.log(update.text)

// 4. Demo Prep (Minutes 30-35)
const script = prepareDemoScript(session)
console.log(`Demo ready: ${script.estimatedDuration} minutes`)
```

### Complete Facilitator Workflow

```typescript
import {
  generateDiscoveryQuestions,
  excavateProblem,
  planEngagementActivities,
  orchestrateDemo,
  generateFollowUp,
} from './facilitator'

// 1. Discovery (Minutes 0-10)
const questions = generateDiscoveryQuestions({ industry: 'legal' })
// Present questions to client, collect responses...

const profile = excavateProblem(session)
if (!profile.complete) {
  console.log('Missing:', profile.missingInformation)
}

// 2. Engagement (Minutes 10-40)
const plan = planEngagementActivities(profile, { duration: 30 })
for (const activity of plan.activities) {
  console.log(`${activity.duration} min: ${activity.description}`)
}

// 3. Demo (Minutes 35-40)
const orchestration = orchestrateDemo(builderScript, profile)
console.log(`Narration style: ${orchestration.narrationStyle}`)

// 4. Follow-up (After session)
const followUp = generateFollowUp(session, demo)
console.log(`Subject: ${followUp.subject}`)
console.log(`Urgency: ${followUp.urgency}`)
if (followUp.roiCalculation) {
  console.log(`ROI: ${followUp.roiCalculation.potentialSavings}/mo`)
}
```

---

## Design Principles

### 1. Test-Driven Development
- Tests written before implementation
- 100% coverage on critical paths
- Tests serve as living documentation

### 2. Type Safety
- Full TypeScript type definitions
- No `any` types in public API
- Comprehensive interface documentation

### 3. Composability
- Small, focused functions
- Clear input/output contracts
- Easy to combine into workflows

### 4. Real-World Tested
- Built from actual demo experience (Template #16)
- Incorporates lessons from 50-minute methodology
- Reflects real client engagement patterns

---

## Future Enhancements

- [ ] CLI tool for interactive workflows
- [ ] Integration with calendar APIs
- [ ] Automatic CRM updates
- [ ] Real-time collaboration features
- [ ] Analytics and conversion tracking
- [ ] Template recommendation ML model
- [ ] Voice-guided demo mode
- [ ] Post-demo feedback collection

---

## Contributing

When adding new features:
1. Write tests first (TDD)
2. Implement minimal viable function
3. Refactor for clarity
4. Update type definitions
5. Add usage examples to README

---

**Built with TDD. Tested in production. Ready for rapid prototyping.**
