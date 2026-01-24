/**
 * RapidProto Workflow Example
 *
 * Demonstrates a complete 50-minute session using builder and facilitator functions
 */

import {
  selectTemplate,
  initializeProject,
  trackProgress,
  communicateStatus,
  prepareDemoScript,
  type BuilderSession,
  type BuildPhase,
} from './builder'

import {
  generateDiscoveryQuestions,
  excavateProblem,
  planEngagementActivities,
  orchestrateDemo,
  generateFollowUp,
  type DiscoverySession,
} from './facilitator'

// ============================================================================
// Simulated 50-Minute Demo Session
// ============================================================================

async function runDemoSession() {
  console.log('\n🚀 RapidProto 50-Minute Demo Session')
  console.log('=' .repeat(60))

  // ==========================================================================
  // MINUTES 0-10: DISCOVERY PHASE
  // ==========================================================================

  console.log('\n📋 PHASE 1: DISCOVERY (Minutes 0-10)')
  console.log('-'.repeat(60))

  // Facilitator generates discovery questions
  console.log('\n1. Generating discovery questions...')
  const questions = generateDiscoveryQuestions({ industry: 'legal' })
  console.log(`   ✓ Generated ${Object.keys(questions).length} question categories`)
  console.log(`   Sample: "${questions.surface[0]}"`)

  // Client provides responses (simulated)
  const discoverySession: DiscoverySession = {
    id: 'session_20260125_001',
    clientName: 'Acme Law Firm',
    startTime: new Date('2026-01-25T10:00:00Z'),
    responses: {
      surface: 'We spend 5 hours a week manually tracking client intake and onboarding',
      currentState: 'Using Excel spreadsheets and email chains',
      successCriteria: 'Automated conflict checking, PDF document extraction, one-click onboarding',
      users: 'Attorneys and paralegals',
      decisionMaker: 'Managing Partner',
      integrations: 'Salesforce, QuickBooks',
      dataFormat: 'CSV exports',
      costPerMonth: '$5000 in admin time',
      volume: '50 new clients per month',
      timeline: 'Need to start in 2 weeks',
      budget: 'Approved up to $25k',
    },
    heatLevel: 'hot',
  }

  console.log('\n2. Excavating problem profile...')
  const problemProfile = excavateProblem(discoverySession)
  console.log(`   ✓ Problem: ${problemProfile.problemStatement}`)
  console.log(`   ✓ Current: ${problemProfile.currentProcess}`)
  console.log(`   ✓ Pain points: ${problemProfile.painPoints?.join(', ')}`)
  console.log(`   ✓ Monthly cost: $${problemProfile.businessImpact.monthlyCost}`)
  console.log(`   ✓ Urgency: ${problemProfile.urgency}`)
  console.log(`   ✓ Complete: ${problemProfile.complete ? 'Yes ✅' : 'No ❌'}`)

  // Builder selects template
  console.log('\n3. Builder selecting template...')
  const templateMatch = selectTemplate(problemProfile.problemStatement || '')
  console.log(`   ✓ Selected: Template #${templateMatch.templateNumber} - ${templateMatch.templateName}`)
  console.log(`   ✓ Confidence: ${(templateMatch.confidence * 100).toFixed(0)}%`)
  console.log(`   ✓ Reasoning: ${templateMatch.reasoning}`)
  console.log(`   ✓ Est. build time: ${templateMatch.estimatedBuildTime} min`)
  console.log(`   ✓ Complexity: ${'⭐'.repeat(templateMatch.complexity)}`)

  // ==========================================================================
  // MINUTES 10-12: RAPID SETUP
  // ==========================================================================

  console.log('\n🔧 PHASE 2: RAPID SETUP (Minutes 10-12)')
  console.log('-'.repeat(60))

  console.log('\n1. Initializing project...')
  const projectInit = await initializeProject({
    templateNumber: templateMatch.templateNumber,
    projectName: 'acme-client-intake',
    clientName: 'Acme Law Firm',
    env: {
      PROJECT_NAME: 'Acme Client Intake',
      DATABASE_URL: 'file:./acme.db',
    },
  })

  if (projectInit.success) {
    console.log(`   ✓ Project created: ${projectInit.projectPath}`)
    console.log(`   ✓ Files created: ${projectInit.filesCreated}`)
    console.log(`   ✓ Environment configured: ${projectInit.envConfigured ? 'Yes' : 'No'}`)
  } else {
    console.log(`   ✗ Error: ${projectInit.error}`)
  }

  // ==========================================================================
  // MINUTES 12-40: BUILD & ENGAGEMENT
  // ==========================================================================

  console.log('\n💻 PHASE 3: BUILD (Minutes 12-30) + ENGAGEMENT (Minutes 10-40)')
  console.log('-'.repeat(60))

  // Builder starts tracking session
  let builderSession: BuilderSession = {
    id: 'session_20260125_001',
    templateNumber: templateMatch.templateNumber,
    startTime: new Date('2026-01-25T10:12:00Z'),
    phases: [],
    customizations: [
      'AI document extraction for intake forms',
      'Conflict checking against existing clients',
      'Salesforce integration for client records',
    ],
    clientRequirements: [
      'Handle PDF and Word document uploads',
      'Flag potential conflicts with existing clients',
      'Export client data to CSV',
    ],
    testScenarios: [
      {
        description: 'Upload PDF intake form',
        expectedOutcome: 'Auto-extract client name, contact, and matter details',
      },
      {
        description: 'Check for conflicts',
        expectedOutcome: 'Show matching existing clients by name/contact',
      },
    ],
    edgeCases: [
      {
        case: 'Duplicate client detection with slight name variations',
        handled: true,
        approach: 'Fuzzy matching using Levenshtein distance',
      },
    ],
    technicalHighlights: [
      'Vercel AI SDK for document extraction (no BYOK)',
      'Drizzle ORM with Turso for edge database',
      'Server actions with Zod validation',
    ],
  }

  // Facilitator plans engagement
  console.log('\n1. Planning engagement activities...')
  const engagementPlan = planEngagementActivities(problemProfile, { duration: 30 })
  console.log(`   ✓ Planned ${engagementPlan.activities.length} activities (${engagementPlan.totalDuration} min)`)
  for (const activity of engagementPlan.activities) {
    console.log(`      - ${activity.duration} min: ${activity.description}`)
  }

  // Simulate build phases
  console.log('\n2. Builder executing phases...')

  const phases: BuildPhase[] = [
    {
      name: 'Data Model',
      startTime: new Date('2026-01-25T10:12:00Z'),
      endTime: new Date('2026-01-25T10:17:00Z'),
      status: 'completed',
    },
    {
      name: 'Core Logic',
      startTime: new Date('2026-01-25T10:17:00Z'),
      endTime: new Date('2026-01-25T10:27:00Z'),
      status: 'completed',
    },
    {
      name: 'UI Integration',
      startTime: new Date('2026-01-25T10:27:00Z'),
      endTime: new Date('2026-01-25T10:35:00Z'),
      status: 'completed',
    },
  ]

  for (const phase of phases) {
    builderSession = trackProgress(builderSession, phase)
    const msg = communicateStatus(builderSession, 'update')
    console.log(`   ${msg.emoji} ${phase.name}: ${phase.status}`)
  }

  // Check progress
  const progressStatus = trackProgress(builderSession)
  console.log(`\n   Time check: ${progressStatus.timeElapsed} min elapsed, ${progressStatus.timeRemaining} min remaining`)
  console.log(`   Status: ${progressStatus.onTrack ? '✅ On track' : '⚠️ Behind schedule'}`)

  // Demo ready
  builderSession.demoReady = true
  builderSession.demoUrl = 'https://acme-client-intake.vercel.app'
  const readyMsg = communicateStatus(builderSession, 'ready')
  console.log(`\n   ${readyMsg.emoji} ${readyMsg.text}`)

  // ==========================================================================
  // MINUTES 35-45: DEMO TIME
  // ==========================================================================

  console.log('\n🎬 PHASE 4: DEMO (Minutes 35-45)')
  console.log('-'.repeat(60))

  console.log('\n1. Preparing demo script...')
  const demoScript = prepareDemoScript(builderSession)
  console.log(`   ✓ Demo script: ${demoScript.sections.length} sections (${demoScript.estimatedDuration} min)`)
  for (const section of demoScript.sections) {
    console.log(`      ${section.duration} min: ${section.title}`)
  }

  console.log('\n2. Orchestrating demo...')
  const orchestration = orchestrateDemo(demoScript, problemProfile)
  console.log(`   ✓ Narration style: ${orchestration.narrationStyle}`)
  console.log(`   ✓ Value translations: ${Object.keys(orchestration.valueTranslations).length} features mapped`)
  for (const [feature, value] of Object.entries(orchestration.valueTranslations)) {
    console.log(`      "${feature}" → "${value}"`)
  }

  // ==========================================================================
  // MINUTES 45-50: NEXT STEPS
  // ==========================================================================

  console.log('\n📧 PHASE 5: FOLLOW-UP (Minutes 45-50)')
  console.log('-'.repeat(60))

  const demo = {
    completedAt: new Date('2026-01-25T10:45:00Z'),
    demoUrl: builderSession.demoUrl,
    recordingUrl: 'https://recordings.zoom.us/demo-123',
    codeRepo: 'https://github.com/acme/client-intake-demo',
  }

  console.log('\n1. Generating follow-up email...')
  const followUp = generateFollowUp(discoverySession, demo)
  console.log(`   ✓ Subject: ${followUp.subject}`)
  console.log(`   ✓ Urgency: ${followUp.urgency}`)
  console.log(`   ✓ Next steps: ${followUp.nextSteps.length} items`)
  for (const step of followUp.nextSteps) {
    console.log(`      - ${step}`)
  }

  if (followUp.roiCalculation) {
    console.log(`\n   💰 ROI Calculation:`)
    console.log(`      Current monthly cost: $${followUp.roiCalculation.currentCost}`)
    console.log(`      Potential savings: $${followUp.roiCalculation.potentialSavings}/mo`)
    console.log(`      Payback period: ${followUp.roiCalculation.paybackPeriod}`)
  }

  if (followUp.pricingTiers) {
    console.log(`\n   💵 Pricing tiers:`)
    for (const tier of followUp.pricingTiers) {
      console.log(`      ${tier.name}: ${tier.price}`)
      console.log(`         ${tier.description}`)
    }
  }

  // ==========================================================================
  // SESSION COMPLETE
  // ==========================================================================

  console.log('\n✅ SESSION COMPLETE')
  console.log('='.repeat(60))
  console.log(`
📊 Session Summary:
   - Client: ${discoverySession.clientName}
   - Template: #${templateMatch.templateNumber} - ${templateMatch.templateName}
   - Build time: ${progressStatus.timeElapsed} minutes
   - Heat level: ${discoverySession.heatLevel}
   - Demo URL: ${builderSession.demoUrl}
   - Next step: ${followUp.nextSteps[0]}

🎯 Result: Working prototype delivered in 50 minutes!
  `)
}

// ============================================================================
// Run the example
// ============================================================================

if (import.meta.url === `file://${process.argv[1]}`) {
  runDemoSession().catch(console.error)
}

export { runDemoSession }
