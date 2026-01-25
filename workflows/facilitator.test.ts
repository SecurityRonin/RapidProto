/**
 * Tests for Facilitator Workflow Functions
 *
 * The facilitator orchestrates discovery, engagement, and closing:
 * - Discovery question generation
 * - Problem excavation
 * - Engagement activities
 * - Demo orchestration
 * - Conversion and closing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  generateDiscoveryQuestions,
  excavateProblem,
  planEngagementActivities,
  orchestrateDemo,
  generateFollowUp,
  type DiscoverySession,
  type ProblemProfile,
  type EngagementPlan,
  type DemoOrchestration,
} from './facilitator'

describe('Facilitator Workflow Functions', () => {
  describe('generateDiscoveryQuestions', () => {
    it('should generate core discovery questions', () => {
      const questions = generateDiscoveryQuestions()

      expect(questions.surface).toBeDefined()
      expect(questions.currentState).toBeDefined()
      expect(questions.successCriteria).toBeDefined()
      expect(questions.constraints).toBeDefined()
      expect(questions.edgeCases).toBeDefined()
    })

    it('should tailor questions to industry', () => {
      const questions = generateDiscoveryQuestions({ industry: 'legal' })

      expect(questions.surface.some(q => q.includes('compliance'))).toBe(true)
      expect(questions.constraints.some(q => q.includes('confidentiality'))).toBe(true)
    })

    it('should adapt questions based on problem type', () => {
      const questions = generateDiscoveryQuestions({ problemType: 'workflow' })

      expect(questions.currentState.some(q => q.includes('steps'))).toBe(true)
      expect(questions.successCriteria.some(q => q.includes('approval'))).toBe(true)
    })

    it('should include the Three Wins framework', () => {
      const questions = generateDiscoveryQuestions()

      const threeWins = questions.successCriteria.find(q => q.includes('three things'))
      expect(threeWins).toBeDefined()
    })
  })

  describe('excavateProblem', () => {
    let session: DiscoverySession

    beforeEach(() => {
      session = {
        id: 'discovery_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
      }
    })

    it('should extract problem statement from responses', () => {
      session.responses = {
        surface: 'We spend 5 hours a week manually tracking client intake',
        currentState: 'Using Excel spreadsheets and email',
        successCriteria: 'Automated workflow with conflict checking',
      }

      const profile = excavateProblem(session)

      expect(profile.problemStatement).toContain('client intake')
      expect(profile.currentProcess).toContain('Excel')
      expect(profile.painPoints).toContain('manual')
    })

    it('should identify stakeholders', () => {
      session.responses = {
        surface: 'Our legal team needs better case management',
        users: 'Attorneys and paralegals',
        decisionMaker: 'Managing Partner',
      }

      const profile = excavateProblem(session)

      expect(profile.stakeholders.users).toContain('Attorneys')
      expect(profile.stakeholders.decisionMaker).toBe('Managing Partner')
    })

    it('should quantify business impact', () => {
      session.responses = {
        surface: 'Manual expense processing',
        costPerMonth: '$5000 in admin time',
        volume: '200 expense reports per month',
      }

      const profile = excavateProblem(session)

      expect(profile.businessImpact.monthlyCost).toBe(5000)
      expect(profile.businessImpact.volume).toBe(200)
      expect(profile.businessImpact.roiPotential).toBeGreaterThan(0)
    })

    it('should flag technical requirements', () => {
      session.responses = {
        integrations: 'Salesforce, QuickBooks',
        compliance: 'HIPAA, SOC2',
        dataFormat: 'CSV exports',
      }

      const profile = excavateProblem(session)

      expect(profile.technicalRequirements.integrations).toContain('Salesforce')
      expect(profile.technicalRequirements.compliance).toContain('HIPAA')
      expect(profile.technicalRequirements.dataFormat).toBe('CSV')
    })

    it('should assess urgency and priority', () => {
      session.responses = {
        timeline: 'Need to start in 2 weeks',
        budget: 'Approved up to $25k',
        competition: 'Evaluating two other vendors',
      }

      const profile = excavateProblem(session)

      expect(profile.urgency).toBe('high')
      expect(profile.budget).toBe(25000)
      expect(profile.competitiveThreat).toBe(true)
    })

    it('should validate completeness of discovery', () => {
      session.responses = {
        surface: 'Need a system',
      }

      const profile = excavateProblem(session)

      expect(profile.complete).toBe(false)
      expect(profile.missingInformation).toContain('current state')
      expect(profile.missingInformation).toContain('success criteria')
    })
  })

  describe('planEngagementActivities', () => {
    it('should plan 30-minute engagement schedule', () => {
      const profile: ProblemProfile = {
        problemStatement: 'Client intake automation',
        domain: 'legal',
        complexity: 'medium',
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const plan = planEngagementActivities(profile, { duration: 30 })

      expect(plan.activities).toHaveLength(5)
      expect(plan.totalDuration).toBeLessThanOrEqual(30)
    })

    it('should include user journey mapping', () => {
      const profile: ProblemProfile = {
        problemStatement: 'Workflow automation',
        domain: 'operations',
        complexity: 'medium',
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const plan = planEngagementActivities(profile)

      const mapping = plan.activities.find(a => a.type === 'user-journey-mapping')
      expect(mapping).toBeDefined()
      expect(mapping?.duration).toBeLessThanOrEqual(5)
    })

    it('should include data deep dive when relevant', () => {
      const profile: ProblemProfile = {
        problemStatement: 'Data processing',
        domain: 'analytics',
        complexity: 'high',
        technicalRequirements: { dataFormat: 'CSV' },
        stakeholders: {},
        businessImpact: {},
      }

      const plan = planEngagementActivities(profile)

      const dataDive = plan.activities.find(a => a.type === 'data-deep-dive')
      expect(dataDive).toBeDefined()
      expect(dataDive?.prompts).toContain('Show sample data')
    })

    it('should plan roadmap discussion', () => {
      const profile: ProblemProfile = {
        problemStatement: 'System implementation',
        domain: 'general',
        complexity: 'medium',
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const plan = planEngagementActivities(profile)

      const roadmap = plan.activities.find(a => a.type === 'roadmap-planning')
      expect(roadmap).toBeDefined()
      expect(roadmap?.phases).toContain('Proof of Concept')
      expect(roadmap?.phases).toContain('Pilot')
      expect(roadmap?.phases).toContain('Production')
    })

    it('should adjust activities based on time constraints', () => {
      const profile: ProblemProfile = {
        problemStatement: 'Quick demo',
        domain: 'general',
        complexity: 'low',
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const plan = planEngagementActivities(profile, { duration: 15 })

      expect(plan.totalDuration).toBeLessThanOrEqual(15)
      expect(plan.activities.length).toBeLessThan(5)
    })
  })

  describe('orchestrateDemo', () => {
    it('should create demo flow from builder script', () => {
      const builderScript = {
        sections: [
          { title: 'Context', duration: 1 },
          { title: 'Happy Path', duration: 2 },
          { title: 'Edge Cases', duration: 2 },
        ],
        demoUrl: 'https://demo.example.com',
      }

      const profile: ProblemProfile = {
        problemStatement: 'Client intake',
        successCriteria: ['Automated conflict checks', 'PDF extraction'],
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const orchestration = orchestrateDemo(builderScript, profile)

      expect(orchestration.totalDuration).toBeLessThanOrEqual(10)
      expect(orchestration.flow).toHaveLength(3)
    })

    it('should map business value to technical features', () => {
      const builderScript = {
        sections: [
          {
            title: 'Happy Path',
            duration: 2,
            features: ['AI document extraction', 'Conflict checking'],
          },
        ],
        demoUrl: 'https://demo.example.com',
      }

      const profile: ProblemProfile = {
        problemStatement: 'Client onboarding',
        painPoints: ['Manual data entry', 'Duplicate clients'],
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const orchestration = orchestrateDemo(builderScript, profile)

      const translations = orchestration.valueTranslations
      expect(translations['AI document extraction']).toContain('Manual data entry')
      expect(translations['Conflict checking']).toContain('Duplicate clients')
    })

    it('should prepare interaction moments', () => {
      const builderScript = {
        sections: [{ title: 'Demo', duration: 3 }],
        demoUrl: 'https://demo.example.com',
        interactiveElements: ['Upload form', 'Filter view'],
      }

      const profile: ProblemProfile = {
        problemStatement: 'Demo',
        technicalRequirements: {},
        stakeholders: {},
        businessImpact: {},
      }

      const orchestration = orchestrateDemo(builderScript, profile)

      expect(orchestration.interactionPoints).toHaveLength(2)
      expect(orchestration.interactionPoints[0].prompt).toContain('Click')
    })

    it('should adapt narration to technical level', () => {
      const builderScript = {
        sections: [{ title: 'Demo', duration: 3 }],
        demoUrl: 'https://demo.example.com',
      }

      const technicalProfile: ProblemProfile = {
        problemStatement: 'Demo',
        stakeholders: { technicalLevel: 'high' },
        technicalRequirements: {},
        businessImpact: {},
      }

      const businessProfile: ProblemProfile = {
        problemStatement: 'Demo',
        stakeholders: { technicalLevel: 'low' },
        technicalRequirements: {},
        businessImpact: {},
      }

      const technicalOrch = orchestrateDemo(builderScript, technicalProfile)
      const businessOrch = orchestrateDemo(builderScript, businessProfile)

      expect(technicalOrch.narrationStyle).toBe('technical')
      expect(businessOrch.narrationStyle).toBe('business-value')
    })
  })

  describe('generateFollowUp', () => {
    it('should generate follow-up email for hot lead', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
        heatLevel: 'hot',
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
        recordingUrl: 'https://recording.example.com',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.subject).toContain('Next Steps')
      expect(followUp.body).toContain('move forward')
      expect(followUp.nextSteps).toContain('Proposal')
      expect(followUp.urgency).toBe('high')
    })

    it('should propose pilot for qualified lead', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
        heatLevel: 'qualified',
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.body).toContain('Pilot')
      expect(followUp.pricingTiers).toHaveLength(2) // Pilot + Full
    })

    it('should nurture lukewarm lead', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
        heatLevel: 'lukewarm',
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.body).toContain('follow up')
      expect(followUp.nextSteps).toContain('Check-in')
      expect(followUp.urgency).toBe('low')
    })

    it('should include attachments', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
        recordingUrl: 'https://recording.example.com',
        codeRepo: 'https://github.com/example/demo',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.attachments).toContain('Demo recording')
      expect(followUp.attachments).toContain('Code repository')
      expect(followUp.links.demoUrl).toBe('https://demo.example.com')
    })

    it('should calculate ROI when business impact available', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
        businessImpact: {
          monthlyCost: 5000,
          volume: 200,
        },
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.roiCalculation).toBeDefined()
      expect(followUp.roiCalculation?.currentCost).toBe(5000)
      expect(followUp.roiCalculation?.potentialSavings).toBeGreaterThan(0)
    })

    it('should set calendar invite for next meeting', () => {
      const session: DiscoverySession = {
        id: 'session_123',
        clientName: 'Acme Corp',
        startTime: new Date(),
        responses: {},
        nextMeeting: new Date('2026-02-01T10:00:00Z'),
      }

      const demo = {
        completedAt: new Date(),
        demoUrl: 'https://demo.example.com',
      }

      const followUp = generateFollowUp(session, demo)

      expect(followUp.calendarInvite).toBeDefined()
      expect(followUp.calendarInvite?.date).toEqual(new Date('2026-02-01T10:00:00Z'))
    })
  })
})
