/**
 * Core Facilitator Library
 * Stub module for facilitator functionality
 *
 * TODO: Implement actual functionality when facilitator features are ready
 */

// Types - flexible to accommodate bridge file usage
export interface DiscoverySession {
  id?: string
  clientName?: string
  businessType?: string
  problemStatement?: string
  phase?: 'initial' | 'deep-dive' | 'prioritization'
  industry?: string
  problemType?: string
  startTime?: Date
  responses?: Record<string, string>
  heatLevel?: 'hot' | 'qualified' | 'lukewarm'
  [key: string]: unknown // Allow additional properties
}

export interface DiscoveryQuestion {
  category: 'pain' | 'impact' | 'timeline' | 'budget' | 'decision'
  question: string
  followUpOn?: string
  priority: 'high' | 'medium' | 'low'
}

export interface ProblemProfile {
  statement: string
  rootCause: string
  impact: {
    financial?: string
    operational?: string
    emotional?: string
  }
  urgency: 'critical' | 'high' | 'medium' | 'low'
  stakeholders: string[]
  [key: string]: unknown
}

export interface EngagementPlan {
  activities: Array<{
    name: string
    duration: number
    description: string
    materials?: string[]
  }>
  totalDuration: number
  objectives: string[]
}

export interface DemoOrchestration {
  introduction: string
  handoffCues: string[]
  clientEngagementPoints: string[]
  feedbackQuestions: string[]
  nextStepsPrompts: string[]
}

export interface FollowUpEmail {
  subject: string
  body: string
  attachmentSuggestions: string[]
  scheduledActions: Array<{
    action: string
    dueDate: string
  }>
}

// Functions (stubs - to be implemented)

export function generateDiscoveryQuestions(session: DiscoverySession): DiscoveryQuestion[] {
  // Stub implementation
  return [
    {
      category: 'pain',
      question: 'What is the biggest challenge you face with your current solution?',
      priority: 'high',
    },
    {
      category: 'impact',
      question: 'How does this problem affect your team\'s productivity?',
      priority: 'high',
    },
    {
      category: 'timeline',
      question: 'When would you ideally like to have a solution in place?',
      priority: 'medium',
    },
    {
      category: 'budget',
      question: 'What budget range are you working with for this initiative?',
      priority: 'medium',
    },
    {
      category: 'decision',
      question: 'Who else will be involved in evaluating potential solutions?',
      priority: 'high',
    },
  ]
}

export function excavateProblem(session: DiscoverySession): ProblemProfile {
  // Stub implementation
  return {
    statement: session.problemStatement || session.responses?.surface || 'To be determined',
    rootCause: 'To be analyzed based on discovery responses',
    impact: {
      operational: 'Productivity loss',
    },
    urgency: 'medium',
    stakeholders: session.clientName ? [session.clientName] : ['Client'],
  }
}

export function planEngagementActivities(
  profile: ProblemProfile,
  options?: { duration?: number }
): EngagementPlan {
  // Stub implementation
  const duration = options?.duration || 20
  return {
    activities: [
      {
        name: 'Context Gathering',
        duration: Math.floor(duration * 0.25),
        description: 'Understand current workflow and pain points',
      },
      {
        name: 'Solution Preview',
        duration: Math.floor(duration * 0.5),
        description: 'Show relevant examples and capabilities',
      },
      {
        name: 'Q&A Session',
        duration: Math.floor(duration * 0.25),
        description: 'Address questions and concerns',
      },
    ],
    totalDuration: duration,
    objectives: ['Understand needs', 'Build rapport', 'Identify priorities'],
  }
}

export function orchestrateDemo(
  demoScript: unknown,
  clientContext: { threeWins?: string[]; painPoints?: string[] }
): DemoOrchestration {
  // Stub implementation
  return {
    introduction: 'Thank you for joining us today. We\'re excited to show you what we\'ve built.',
    handoffCues: [
      'Builder will now show the main dashboard',
      'Let me hand it over to demonstrate the workflow',
    ],
    clientEngagementPoints: [
      'Does this address your concern about X?',
      'How does this compare to your current process?',
    ],
    feedbackQuestions: [
      'What stands out to you most?',
      'Is there anything you\'d like to see work differently?',
    ],
    nextStepsPrompts: [
      'Would you like to schedule a follow-up to discuss implementation?',
      'Who else should we involve in the next conversation?',
    ],
  }
}

export function generateFollowUp(
  sessionSummary: {
    clientName: string
    threeWins: string[]
    nextSteps: string[]
    templateUsed: string
  }
): FollowUpEmail {
  // Stub implementation
  return {
    subject: `Follow-up: ${sessionSummary.templateUsed} Demo for ${sessionSummary.clientName}`,
    body: `Hi ${sessionSummary.clientName},

Thank you for taking the time to meet with us today. We enjoyed learning about your needs and demonstrating how we can help.

As discussed, your three key wins are:
${sessionSummary.threeWins.map((w, i) => `${i + 1}. ${w}`).join('\n')}

Next steps:
${sessionSummary.nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')}

Please let me know if you have any questions.

Best regards`,
    attachmentSuggestions: ['Demo recording', 'Feature overview PDF'],
    scheduledActions: [
      {
        action: 'Send demo recording',
        dueDate: 'Within 24 hours',
      },
      {
        action: 'Schedule follow-up call',
        dueDate: 'Within 3 business days',
      },
    ],
  }
}
