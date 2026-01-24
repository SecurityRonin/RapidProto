#!/usr/bin/env node
/**
 * RapidProto: Build All Templates
 *
 * Generates scaffolding for all 75 templates
 * Priority templates get full implementation, others get scaffolding
 */

const { execFileSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Template definitions from TEMPLATES_COMPLETE.md
const templates = [
  // Phase 1: High Priority - Full Implementation (manually built with TDD)
  { num: 26, name: 'Service Appointments', priority: 'VERY HIGH', impl: 'FULL' },
  { num: 27, name: 'Event Registration', priority: 'VERY HIGH', impl: 'FULL' },
  { num: 28, name: 'Job Board ATS', priority: 'VERY HIGH', impl: 'FULL' },
  { num: 2, name: 'Invoice Generator', priority: 'HIGH', impl: 'FULL' },
  { num: 8, name: 'Lead Tracking', priority: 'HIGH', impl: 'FULL' },
  { num: 1, name: 'Expense Tracker', priority: 'HIGH', impl: 'FULL' },
  { num: 4, name: 'Time Tracker', priority: 'HIGH', impl: 'FULL' },
  { num: 18, name: 'Billable Hours', priority: 'HIGH', impl: 'FULL' },
  { num: 36, name: 'Delivery Route Planning', priority: 'VERY HIGH', impl: 'FULL' },
  { num: 46, name: 'Campaign Management', priority: 'VERY HIGH', impl: 'FULL' },

  // Phase 2: Medium Priority - Scaffold + Partial Implementation
  { num: 3, name: 'Meeting Scheduler', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 5, name: 'Resource Booking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 6, name: 'Approval Workflow', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 7, name: 'Document Generator', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 9, name: 'Customer Feedback', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 10, name: 'KPI Dashboard', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 11, name: 'Report Builder', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 12, name: 'Employee Onboarding', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 13, name: 'Leave Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 14, name: 'Inventory Management', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 15, name: 'Vendor Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 17, name: 'Matter Management', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 19, name: 'Client Portal', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 20, name: 'CPE CLE Tracking', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 21, name: 'Student Enrollment', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 22, name: 'Attendance Tracking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 23, name: 'Grade Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 24, name: 'Parent Communication', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 25, name: 'Assignment Submission', priority: 'MEDIUM', impl: 'SCAFFOLD' },

  // Phase 3: Expansion Templates - Scaffold Only
  { num: 29, name: 'Marketplace Platform', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 30, name: 'Volunteer Shift Scheduling', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 31, name: 'Tutor Student Matching', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 32, name: 'Healthcare Provider Scheduling', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 33, name: 'Equipment Rental Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 34, name: 'Court Field Reservation', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 35, name: 'Workspace Booking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 37, name: 'Fleet Management', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 38, name: 'Quality Control Inspections', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 39, name: 'Incident Safety Reporting', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 40, name: 'Asset Tracking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 41, name: 'Maintenance Work Orders', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 42, name: 'Warranty Management', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 43, name: 'Returns RMA Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 44, name: 'Procurement Purchase Orders', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 45, name: 'Supplier Performance Tracking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 47, name: 'Influencer Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 48, name: 'Affiliate Partner Portal', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 49, name: 'Referral Program', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 50, name: 'Customer Loyalty Program', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 51, name: 'Contest Giveaway Manager', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 52, name: 'Webinar Platform', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 53, name: 'Email Campaign Builder', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 54, name: 'Social Media Scheduler', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 55, name: 'Lead Magnets Downloads', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 56, name: 'Patient Portal', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 57, name: 'Telehealth Platform', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 58, name: 'Meal Planning Nutrition', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 59, name: 'Fitness Program Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 60, name: 'Mental Health Check-ins', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 61, name: 'Donation Management', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 62, name: 'Grant Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 63, name: 'Member Directory', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 64, name: 'Community Forum', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 65, name: 'Petition Platform', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 66, name: 'Property Listings Platform', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 67, name: 'Lease Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 68, name: 'HOA Management', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 69, name: 'Showing Scheduler', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 70, name: 'Short-term Rental Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 71, name: 'Production Scheduling', priority: 'HIGH', impl: 'SCAFFOLD' },
  { num: 72, name: 'Batch Tracking', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 73, name: 'Equipment Calibration', priority: 'LOW', impl: 'SCAFFOLD' },
  { num: 74, name: 'Recipe Formula Management', priority: 'MEDIUM', impl: 'SCAFFOLD' },
  { num: 75, name: 'Tool Crib Management', priority: 'LOW', impl: 'SCAFFOLD' },
]

console.log('🚀 RapidProto: Building All Templates\n')
console.log(`📦 Total templates: ${templates.length}`)
console.log(`✅ Full implementation: ${templates.filter(t => t.impl === 'FULL').length}`)
console.log(`📋 Scaffold only: ${templates.filter(t => t.impl === 'SCAFFOLD').length}\n`)

let generated = 0
let skipped = 0

templates.forEach(template => {
  const templateDir = `template-${template.num}-${template.name.toLowerCase().replace(/\s+/g, '-')}`

  if (fs.existsSync(templateDir)) {
    console.log(`⏭️  Skipping #${template.num} (already exists)`)
    skipped++
    return
  }

  try {
    console.log(`\n🔨 Generating #${template.num}: ${template.name} [${template.impl}]`)
    execFileSync('node', ['scripts/generate-template.js', String(template.num), template.name], {
      stdio: 'inherit',
      cwd: process.cwd(),
    })
    generated++
  } catch (error) {
    console.error(`❌ Failed to generate #${template.num}: ${error.message}`)
  }
})

console.log(`\n\n✨ Generation complete!`)
console.log(`   Generated: ${generated}`)
console.log(`   Skipped: ${skipped}`)
console.log(`\n📝 Next steps:`)
console.log(`   1. Review TEMPLATES_COMPLETE.md for full specs`)
console.log(`   2. Implement Phase 1 templates (#26, #27, #28, #2, #8, #1, #4, #18, #36, #46) with full TDD`)
console.log(`   3. Fill in Phase 2 templates as needed`)
console.log(`   4. Generate implementations for Phase 3 on demand`)
console.log(`\n🎯 Priority build order:`)
const fullImpl = templates.filter(t => t.impl === 'FULL').slice(0, 10)
fullImpl.forEach((t, i) => {
  console.log(`   ${i + 1}. Template #${t.num}: ${t.name}`)
})
console.log()
