/**
 * Facilitator Workflow Functions
 *
 * Orchestrates discovery, engagement, and closing:
 * - Discovery question generation with industry adaptation
 * - Problem excavation and profiling
 * - Engagement activity planning
 * - Demo orchestration with value translation
 * - Follow-up generation with ROI calculation
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface DiscoveryQuestions {
  surface: string[]
  currentState: string[]
  successCriteria: string[]
  constraints: string[]
  edgeCases: string[]
}

export interface DiscoverySession {
  id: string
  clientName: string
  startTime: Date
  responses: Record<string, any>
  heatLevel?: 'hot' | 'qualified' | 'lukewarm' | 'cold'
  nextMeeting?: Date
  businessImpact?: {
    monthlyCost?: number
    volume?: number
  }
}

export interface ProblemProfile {
  problemStatement?: string
  currentProcess?: string
  painPoints?: string[]
  domain?: string
  complexity?: string
  successCriteria?: string[]
  technicalRequirements: {
    integrations?: string[]
    compliance?: string[]
    dataFormat?: string
  }
  stakeholders: {
    users?: string[]
    decisionMaker?: string
    technicalLevel?: 'low' | 'medium' | 'high'
  }
  businessImpact: {
    monthlyCost?: number
    volume?: number
    roiPotential?: number
  }
  urgency?: 'low' | 'medium' | 'high'
  budget?: number
  competitiveThreat?: boolean
  complete?: boolean
  missingInformation?: string[]
}

export interface EngagementActivity {
  type: string
  duration: number
  description: string
  prompts?: string[]
  phases?: string[]
}

export interface EngagementPlan {
  activities: EngagementActivity[]
  totalDuration: number
}

export interface DemoOrchestration {
  flow: Array<{
    section: string
    duration: number
    facilitatorRole: string
  }>
  totalDuration: number
  valueTranslations: Record<string, string>
  interactionPoints: Array<{
    timing: string
    element: string
    prompt: string
  }>
  narrationStyle: 'technical' | 'business-value'
}

export interface FollowUpEmail {
  subject: string
  body: string
  nextSteps: string[]
  urgency: 'low' | 'medium' | 'high'
  pricingTiers?: Array<{
    name: string
    price: string
    description: string
  }>
  attachments: string[]
  links: {
    demoUrl?: string
    recordingUrl?: string
    codeRepo?: string
  }
  roiCalculation?: {
    currentCost: number
    potentialSavings: number
    paybackPeriod: string
  }
  calendarInvite?: {
    date: Date
    title: string
    duration: number
  }
}

// ============================================================================
// Discovery Question Generation
// ============================================================================

export function generateDiscoveryQuestions(
  context?: { industry?: string; problemType?: string }
): DiscoveryQuestions {
  const questions: DiscoveryQuestions = {
    surface: [],
    currentState: [],
    successCriteria: [],
    constraints: [],
    edgeCases: [],
  }

  // Surface questions
  questions.surface = [
    'Tell me what problem you\'re trying to solve.',
    'What\'s the biggest pain point in your current process?',
    'If you could wave a magic wand, what would be different?',
  ]

  // Current state questions
  questions.currentState = [
    'Walk me through how you handle this TODAY.',
    'How much time does this cost you per week/month?',
    'Who\'s affected by this problem?',
    'What have you tried already?',
  ]

  if (context?.problemType === 'workflow') {
    questions.currentState.push(
      'How many steps are in the current process?',
      'Where do approvals happen?',
      'What causes delays in the workflow?'
    )
  }

  // Success criteria (Three Wins framework)
  questions.successCriteria = [
    'If we solve this perfectly, what does that look like?',
    'How will you KNOW it\'s working?',
    'What\'s the minimum version that would be useful?',
    'If we nail this, what are the three things you\'d be able to do that you can\'t do today?',
  ]

  if (context?.problemType === 'workflow') {
    questions.successCriteria.push(
      'What\'s the ideal approval turnaround time?',
      'What notifications should stakeholders receive?'
    )
  }

  // Constraints
  questions.constraints = [
    'What systems does this need to connect to?',
    'Who needs access to this?',
    'Any existing data we should use?',
  ]

  if (context?.industry === 'legal') {
    questions.constraints.push(
      'Any compliance requirements? (GDPR, HIPAA, etc.)',
      'What confidentiality measures are required?',
      'Are there bar association rules we need to consider?'
    )
    questions.surface.push('How does this impact client compliance and risk management?')
  }

  // Edge cases
  questions.edgeCases = [
    'What\'s the weirdest edge case you\'ve seen?',
    'What happens when [unlikely scenario]?',
    'Have you ever had [catastrophic failure]?',
  ]

  return questions
}

// ============================================================================
// Problem Excavation
// ============================================================================

export function excavateProblem(session: DiscoverySession): ProblemProfile {
  const { responses } = session
  const missingInformation: string[] = []

  // Extract problem statement
  const problemStatement = responses.surface || responses.problem

  // Extract current process
  const currentProcess = responses.currentState

  // Extract pain points
  const painPoints: string[] = []
  if (problemStatement && typeof problemStatement === 'string') {
    if (problemStatement.toLowerCase().includes('manual')) {
      painPoints.push('manual')
    }
    if (problemStatement.toLowerCase().includes('slow')) {
      painPoints.push('slow')
    }
    if (problemStatement.toLowerCase().includes('error')) {
      painPoints.push('error-prone')
    }
  }

  // Extract success criteria
  const successCriteria: string[] = []
  if (responses.successCriteria) {
    if (Array.isArray(responses.successCriteria)) {
      successCriteria.push(...responses.successCriteria)
    } else if (typeof responses.successCriteria === 'string') {
      successCriteria.push(responses.successCriteria)
    }
  }

  // Extract stakeholders - split by 'and' and commas
  let users: string[] | undefined
  if (responses.users) {
    if (Array.isArray(responses.users)) {
      users = responses.users
    } else {
      users = responses.users.split(/(?:,|\s+and\s+)/i).map((s: string) => s.trim()).filter(Boolean)
    }
  }

  const stakeholders: ProblemProfile['stakeholders'] = {
    users,
    decisionMaker: responses.decisionMaker,
  }

  // Extract technical requirements
  const technicalRequirements: ProblemProfile['technicalRequirements'] = {
    integrations: responses.integrations
      ? (Array.isArray(responses.integrations) ? responses.integrations : responses.integrations.split(',').map((s: string) => s.trim()))
      : undefined,
    compliance: responses.compliance
      ? (Array.isArray(responses.compliance) ? responses.compliance : responses.compliance.split(',').map((s: string) => s.trim()))
      : undefined,
    dataFormat: responses.dataFormat
      ? responses.dataFormat.split(' ')[0]  // Extract just 'CSV' from 'CSV exports'
      : undefined,
  }

  // Extract business impact
  const businessImpact: ProblemProfile['businessImpact'] = {}
  if (responses.costPerMonth) {
    const match = responses.costPerMonth.match(/\$?(\d+,?\d*)/)
    if (match) {
      businessImpact.monthlyCost = parseInt(match[1].replace(',', ''))
    }
  }
  if (responses.volume) {
    const match = responses.volume.match(/(\d+)/)
    if (match) {
      businessImpact.volume = parseInt(match[1])
    }
  }
  if (businessImpact.monthlyCost) {
    businessImpact.roiPotential = businessImpact.monthlyCost * 0.7 // 70% savings assumption
  }

  // Assess urgency
  let urgency: ProblemProfile['urgency'] = 'medium'
  if (responses.timeline) {
    const timeline = responses.timeline.toLowerCase()
    if (timeline.includes('urgent') || timeline.includes('asap') || timeline.includes('week')) {
      urgency = 'high'
    }
  }

  // Extract budget
  let budget: number | undefined
  if (responses.budget) {
    const match = responses.budget.match(/\$?(\d+,?\d*)[kK]?/)
    if (match) {
      let amount = parseInt(match[1].replace(',', ''))
      if (responses.budget.includes('k') || responses.budget.includes('K')) {
        amount *= 1000
      }
      budget = amount
    }
  }

  // Check competitive threat
  const competitiveThreat = responses.competition !== undefined

  // Validate completeness
  if (!problemStatement) missingInformation.push('problem statement')
  if (!currentProcess) missingInformation.push('current state')
  if (successCriteria.length === 0) missingInformation.push('success criteria')

  const complete = missingInformation.length === 0

  return {
    problemStatement,
    currentProcess,
    painPoints,
    successCriteria,
    stakeholders,
    technicalRequirements,
    businessImpact,
    urgency,
    budget,
    competitiveThreat,
    complete,
    missingInformation: missingInformation.length > 0 ? missingInformation : undefined,
  }
}

// ============================================================================
// Engagement Activity Planning
// ============================================================================

export function planEngagementActivities(
  profile: ProblemProfile,
  options?: { duration?: number }
): EngagementPlan {
  const maxDuration = options?.duration || 30
  const activities: EngagementActivity[] = []

  // Activity 1: User Journey Mapping (5 min)
  if (maxDuration >= 5) {
    activities.push({
      type: 'user-journey-mapping',
      duration: 5,
      description: 'Map the user journey from start to finish',
      prompts: [
        'Walk me through each step',
        'What could go wrong here?',
        'Who else needs to be notified?',
      ],
    })
  }

  // Activity 2: Data Deep Dive (5 min)
  if (maxDuration >= 10) {
    activities.push({
      type: 'data-deep-dive',
      duration: 5,
      description: 'Examine actual data samples',
      prompts: [
        'Show sample data',
        'What\'s the data quality like?',
        'How often is this updated?',
      ],
    })
  }

  // Activity 3: Integration Inventory (5 min)
  if (maxDuration >= 20) {
    activities.push({
      type: 'integration-inventory',
      duration: 5,
      description: 'Map integration points and priorities',
      prompts: [
        'Which integrations are must-have vs. nice-to-have?',
        'Do you have API access?',
      ],
    })
  }

  // Activity 4: Roadmap Planning (include if there's time)
  if (maxDuration >= 15) {
    activities.push({
      type: 'roadmap-planning',
      duration: 5,
      description: 'Plan phases from POC to production',
      phases: ['Proof of Concept', 'Pilot', 'Production'],
      prompts: [
        'When would you want to start pilot testing?',
        'What\'s the approval process?',
      ],
    })
  }

  // Activity 5: Stakeholder Mapping (5 min)
  if (maxDuration >= 25) {
    activities.push({
      type: 'stakeholder-mapping',
      duration: 5,
      description: 'Identify decision makers and users',
      prompts: [
        'Who needs to sign off?',
        'Who are the day-to-day users?',
      ],
    })
  }

  const totalDuration = activities.reduce((sum, a) => sum + a.duration, 0)

  return {
    activities,
    totalDuration,
  }
}

// ============================================================================
// Demo Orchestration
// ============================================================================

export function orchestrateDemo(
  builderScript: any,
  profile: ProblemProfile
): DemoOrchestration {
  const flow = builderScript.sections.map((section: any) => ({
    section: section.title,
    duration: section.duration,
    facilitatorRole: getFacilitatorRole(section.title),
  }))

  const totalDuration = flow.reduce((sum: number, f: any) => sum + f.duration, 0)

  // Map technical features to business value
  const valueTranslations: Record<string, string> = {}
  if (builderScript.sections) {
    for (const section of builderScript.sections) {
      if (section.features) {
        for (const feature of section.features) {
          valueTranslations[feature] = translateToBusiness(feature, profile)
        }
      }
    }
  }

  // Prepare interaction points
  const interactionPoints: DemoOrchestration['interactionPoints'] = []
  if (builderScript.interactiveElements) {
    for (const element of builderScript.interactiveElements) {
      interactionPoints.push({
        timing: 'During demo',
        element,
        prompt: `Click on "${element}" to try it yourself`,
      })
    }
  }

  // Determine narration style
  const technicalLevel = profile.stakeholders.technicalLevel || 'medium'
  const narrationStyle: DemoOrchestration['narrationStyle'] =
    technicalLevel === 'high' ? 'technical' : 'business-value'

  return {
    flow,
    totalDuration,
    valueTranslations,
    interactionPoints,
    narrationStyle,
  }
}

function getFacilitatorRole(sectionTitle: string): string {
  const roles: Record<string, string> = {
    'Context Setting': 'Introduce and frame the demo',
    'Context': 'Introduce and frame the demo',
    'Happy Path': 'Translate features to business value',
    'Edge Cases': 'Highlight specific wins',
    'Future State': 'Preview production enhancements',
  }
  return roles[sectionTitle] || 'Guide and narrate'
}

function translateToBusiness(feature: string, profile: ProblemProfile): string {
  const featureLower = feature.toLowerCase()
  const painPoints = profile.painPoints || []

  if (featureLower.includes('ai') && featureLower.includes('extraction')) {
    return 'Eliminates Manual data entry through automation'
  }

  if (featureLower.includes('conflict') && featureLower.includes('check')) {
    return 'Prevents Duplicate clients through automated matching'
  }

  if (featureLower.includes('notification')) {
    return 'Keeps stakeholders informed automatically'
  }

  if (featureLower.includes('dashboard')) {
    return 'Real-time visibility into operations'
  }

  return `Implements ${feature}`
}

// ============================================================================
// Follow-Up Generation
// ============================================================================

export function generateFollowUp(
  session: DiscoverySession,
  demo: { completedAt: Date; demoUrl?: string; recordingUrl?: string; codeRepo?: string }
): FollowUpEmail {
  const heatLevel = session.heatLevel || 'qualified'

  let subject = ''
  let body = ''
  let urgency: FollowUpEmail['urgency'] = 'medium'
  const nextSteps: string[] = []
  const attachments: string[] = []
  let pricingTiers: FollowUpEmail['pricingTiers'] | undefined

  // Build links
  const links: FollowUpEmail['links'] = {
    demoUrl: demo.demoUrl,
    recordingUrl: demo.recordingUrl,
    codeRepo: demo.codeRepo,
  }

  // Add standard attachments
  if (demo.recordingUrl) attachments.push('Demo recording')
  if (demo.codeRepo) attachments.push('Code repository')
  attachments.push('Session notes')

  // Generate content based on heat level
  if (heatLevel === 'hot') {
    subject = `${session.clientName} - Next Steps After Demo`
    urgency = 'high'
    body = `Thanks for the session today! I'm excited that you want to move forward with this.

**What we demonstrated:**
- Live working prototype addressing your core needs
- ${demo.demoUrl ? `Demo URL: ${demo.demoUrl}` : 'Custom solution'}

**Next Steps:**
1. We'll send over a formal proposal by end of week
2. You review internally and get approval
3. We schedule kickoff meeting

Let's get a kickoff meeting on the calendar - what does next week look like?`

    nextSteps.push(
      'Send proposal by end of week',
      'Client internal review',
      'Schedule kickoff meeting',
      'Proposal'
    )
  } else if (heatLevel === 'qualified') {
    subject = `${session.clientName} - Pilot Program Proposal`
    urgency = 'medium'
    body = `Thanks for the great session today!

**What we built:**
- Proof-of-concept demonstrating the core approach
- ${demo.demoUrl ? `Demo URL: ${demo.demoUrl}` : 'Working prototype'}

**Pilot Program:**
We'd recommend starting with a 2-week Pilot to validate the approach with your team.

**Investment:**
- Pilot: $2,500 - $7,500 (based on scope)
- Full build: $15,000 - $25,000 (if you move forward)

This de-risks the investment while giving you a working system to test.

Sound good?`

    nextSteps.push(
      'Review pilot proposal',
      'Internal stakeholder alignment',
      'Pilot kickoff',
      'Check-in'
    )

    pricingTiers = [
      {
        name: 'Pilot',
        price: '$2,500 - $7,500',
        description: '2-week pilot to validate approach',
      },
      {
        name: 'Full Build',
        price: '$15,000 - $25,000',
        description: 'Complete production-ready system',
      },
    ]
  } else if (heatLevel === 'lukewarm') {
    subject = `${session.clientName} - Demo Follow-Up`
    urgency = 'low'
    body = `Thanks for joining today's session!

**What we demonstrated:**
- Working prototype built in 30 minutes
- Proof that the technical approach works

**Resources:**
${demo.demoUrl ? `- Demo URL: ${demo.demoUrl}` : ''}
${demo.recordingUrl ? `- Recording: ${demo.recordingUrl}` : ''}
${demo.codeRepo ? `- Code: ${demo.codeRepo}` : ''}

Feel free to share these with your team. I'll follow up in a few weeks to see if timing has improved.`

    nextSteps.push('Share with team', 'Check-in')
  } else {
    subject = `${session.clientName} - Demo Follow-Up`
    urgency = 'low'
    body = `Thanks for joining today's session!

**What we demonstrated:**
- Working prototype built in 30 minutes
- Proof that the technical approach works

**Resources:**
${demo.demoUrl ? `- Demo URL: ${demo.demoUrl}` : ''}
${demo.recordingUrl ? `- Recording: ${demo.recordingUrl}` : ''}
${demo.codeRepo ? `- Code: ${demo.codeRepo}` : ''}

Feel free to share these with your team. When you're ready to discuss next steps, just let me know!`

    nextSteps.push('Share with team', 'Check-in in 30 days')
  }

  // Calculate ROI if data available
  let roiCalculation: FollowUpEmail['roiCalculation'] | undefined
  if (session.businessImpact?.monthlyCost) {
    const currentCost = session.businessImpact.monthlyCost
    const potentialSavings = currentCost * 0.7 // 70% reduction
    const implementationCost = 15000 // Average
    const paybackMonths = Math.ceil(implementationCost / potentialSavings)

    roiCalculation = {
      currentCost,
      potentialSavings,
      paybackPeriod: `${paybackMonths} months`,
    }
  }

  // Calendar invite if next meeting scheduled
  let calendarInvite: FollowUpEmail['calendarInvite'] | undefined
  if (session.nextMeeting) {
    calendarInvite = {
      date: session.nextMeeting,
      title: `${session.clientName} - Follow-up Meeting`,
      duration: 30,
    }
  }

  return {
    subject,
    body,
    nextSteps,
    urgency,
    pricingTiers,
    attachments,
    links,
    roiCalculation,
    calendarInvite,
  }
}
