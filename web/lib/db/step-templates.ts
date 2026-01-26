/**
 * Step Templates for Builder and Facilitator
 * Pre-defined checklists for each role's workflow
 */

import type { Role, Phase } from './schema'

export interface StepTemplate {
  role: Role
  phase: Phase
  stepNumber: number
  title: string
  description: string
  estimatedMinutes: number
}

/**
 * Builder's checklist: 50 minutes total
 * - Discovery (10 min): Define what to build
 * - Build (30 min): Code the prototype
 * - Verify (10 min): Test and ship
 */
export const builderSteps: StepTemplate[] = [
  // Discovery phase (10 min)
  {
    role: 'builder',
    phase: 'discovery',
    stepNumber: 1,
    title: 'Define core feature',
    description: 'What is the ONE thing this prototype must do?',
    estimatedMinutes: 3,
  },
  {
    role: 'builder',
    phase: 'discovery',
    stepNumber: 2,
    title: 'Pick a template',
    description: 'Choose a starting point that gets you closest',
    estimatedMinutes: 4,
  },
  {
    role: 'builder',
    phase: 'discovery',
    stepNumber: 3,
    title: 'List required changes',
    description: 'What needs to be added or modified?',
    estimatedMinutes: 3,
  },

  // Build phase (30 min)
  {
    role: 'builder',
    phase: 'build',
    stepNumber: 1,
    title: 'Set up project',
    description: 'Clone template, install dependencies',
    estimatedMinutes: 5,
  },
  {
    role: 'builder',
    phase: 'build',
    stepNumber: 2,
    title: 'Implement core feature',
    description: 'Build the main functionality',
    estimatedMinutes: 15,
  },
  {
    role: 'builder',
    phase: 'build',
    stepNumber: 3,
    title: 'Style and polish',
    description: 'Make it look presentable',
    estimatedMinutes: 10,
  },

  // Verify phase (10 min)
  {
    role: 'builder',
    phase: 'demo',
    stepNumber: 1,
    title: 'Test the happy path',
    description: 'Does the core feature work?',
    estimatedMinutes: 4,
  },
  {
    role: 'builder',
    phase: 'demo',
    stepNumber: 2,
    title: 'Fix critical bugs',
    description: 'Only blockers, skip nice-to-haves',
    estimatedMinutes: 4,
  },
  {
    role: 'builder',
    phase: 'demo',
    stepNumber: 3,
    title: 'Ship or screenshot',
    description: 'Deploy it or capture evidence',
    estimatedMinutes: 2,
  },
]

/**
 * Facilitator's checklist: Active during builder's Build phase (30 min)
 * - Expectations (10 min): Set scope and success criteria
 * - Long Term (10 min): Discuss roadmap and relationship
 * - Close (10 min): Pricing, licensing, next steps
 */
export const facilitatorSteps: StepTemplate[] = [
  // Manage Expectations stage (10 min)
  {
    role: 'facilitator',
    phase: 'expectations',
    stepNumber: 1,
    title: 'Define prototype scope',
    description: "What features WILL be shown in today's demo?",
    estimatedMinutes: 3,
  },
  {
    role: 'facilitator',
    phase: 'expectations',
    stepNumber: 2,
    title: 'Clarify out of scope',
    description: "What WON'T be covered today?",
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'expectations',
    stepNumber: 3,
    title: 'Set success criteria',
    description: 'What would make this demo a win for you?',
    estimatedMinutes: 3,
  },
  {
    role: 'facilitator',
    phase: 'expectations',
    stepNumber: 4,
    title: 'Explain technical limitations',
    description: 'Some parts will be mocked/simulated - set expectations',
    estimatedMinutes: 2,
  },

  // Discuss Long Term stage (10 min)
  {
    role: 'facilitator',
    phase: 'longterm',
    stepNumber: 1,
    title: 'Feature roadmap',
    description: 'After the prototype, what features matter most?',
    estimatedMinutes: 3,
  },
  {
    role: 'facilitator',
    phase: 'longterm',
    stepNumber: 2,
    title: 'Priority order',
    description: 'If you had to pick the top 3 for v1...',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'longterm',
    stepNumber: 3,
    title: 'Timeline expectations',
    description: 'When would you ideally launch the full product?',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'longterm',
    stepNumber: 4,
    title: 'Key milestones',
    description: 'What checkpoints matter to you along the way?',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'longterm',
    stepNumber: 5,
    title: 'Ongoing relationship',
    description: 'How do you see us working together after launch?',
    estimatedMinutes: 1,
  },

  // Close the Deal stage (10 min)
  {
    role: 'facilitator',
    phase: 'close',
    stepNumber: 1,
    title: 'Pricing discussion',
    description: 'Walk through the pricing structure',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'close',
    stepNumber: 2,
    title: 'Package options',
    description: "What's included at each tier?",
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'close',
    stepNumber: 3,
    title: 'Licensing & ownership',
    description: 'Clarify IP, code ownership, usage rights',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'close',
    stepNumber: 4,
    title: 'Next steps',
    description: 'If the demo goes well, what happens next?',
    estimatedMinutes: 2,
  },
  {
    role: 'facilitator',
    phase: 'close',
    stepNumber: 5,
    title: 'Commitment/deposit',
    description: 'To move forward, we would need...',
    estimatedMinutes: 2,
  },
]

/**
 * Get step templates for a specific role
 */
export function getStepsForRole(role: Role): StepTemplate[] {
  return role === 'builder' ? builderSteps : facilitatorSteps
}

/**
 * Get all step templates
 */
export function getAllStepTemplates(): StepTemplate[] {
  return [...builderSteps, ...facilitatorSteps]
}
