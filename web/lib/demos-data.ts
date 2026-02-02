// Demo and Template metadata for the portfolio

export interface Demo {
  slug: string
  title: string
  titleChinese?: string
  description: string
  category: string
  tags: string[]
  icon: string // Lucide icon name
  status: 'live' | 'coming-soon' | 'prototype'
  features: string[]
  // Source indicates where the demo code lives
  source: 'web' | 'projects' // 'web' = /app/demos/[slug], 'projects' = /projects/[slug]
}

export interface Template {
  id: string
  title: string
  description: string
  category: string
  techStack: string[]
  complexity: 'starter' | 'intermediate' | 'advanced'
  hasAI: boolean
}

export const DEMOS: Demo[] = [
  {
    slug: 'writing-feedback',
    title: 'DSE Writing Feedback',
    titleChinese: 'DSE 作文批改',
    description: 'AI-powered essay grading following Hong Kong DSE marking criteria for Chinese and English compositions.',
    category: 'Education',
    tags: ['AI', 'Education', 'DSE', 'Hong Kong'],
    icon: 'FileText',
    status: 'live',
    source: 'web',
    features: [
      'Chinese & English mode',
      'HKEAA DSE rubric alignment',
      'Detailed category scoring',
      'Strengths & improvements feedback'
    ]
  },
  {
    slug: 'exercise-generator',
    title: 'Bloom\'s Taxonomy Exercises',
    titleChinese: '布魯姆分類法練習',
    description: 'Generate educational exercises aligned with Bloom\'s Taxonomy cognitive levels for any subject.',
    category: 'Education',
    tags: ['AI', 'Education', 'Bloom\'s Taxonomy'],
    icon: 'Brain',
    status: 'live',
    source: 'web',
    features: [
      '6 cognitive levels',
      'Multiple subjects',
      'MC & open-ended questions',
      'Explanations included'
    ]
  },
  {
    slug: 'acme-client-intake',
    title: 'Client Intake Automation',
    description: 'Professional services client onboarding with AI document extraction and conflict checking.',
    category: 'Legal',
    tags: ['AI', 'Legal', 'Automation', 'Document Processing'],
    icon: 'Users',
    status: 'prototype',
    source: 'projects',
    features: [
      'AI document extraction',
      'Conflict checking',
      'Admin dashboard',
      'Email notifications'
    ]
  },
  {
    slug: 'test-project',
    title: 'Test Project',
    description: 'A minimal test project demonstrating the base template structure and TDD workflow.',
    category: 'Development',
    tags: ['Testing', 'Template', 'TDD'],
    icon: 'TestTube',
    status: 'prototype',
    source: 'projects',
    features: [
      'Vitest setup',
      'Drizzle ORM',
      'Server actions',
      'Type-safe schemas'
    ]
  }
]

export const TEMPLATE_CATEGORIES = [
  { id: 'education', name: 'Education', icon: 'GraduationCap' },
  { id: 'finance', name: 'Finance', icon: 'DollarSign' },
  { id: 'hr', name: 'Human Resources', icon: 'Users' },
  { id: 'legal', name: 'Legal', icon: 'Scale' },
  { id: 'logistics', name: 'Logistics', icon: 'Truck' },
  { id: 'sales', name: 'Sales', icon: 'TrendingUp' },
  { id: 'scheduling', name: 'Scheduling', icon: 'Calendar' },
  { id: 'services', name: 'Services', icon: 'Briefcase' },
  { id: 'operations', name: 'Operations', icon: 'Settings' },
  { id: 'misc', name: 'Miscellaneous', icon: 'Package' },
]

export const TEMPLATES: Template[] = [
  // Finance
  { id: '01-expense-tracker', title: 'Expense Tracker', description: 'Track and categorize business expenses', category: 'finance', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'starter', hasAI: false },
  { id: '02-invoice-generator', title: 'Invoice Generator', description: 'Create and manage professional invoices', category: 'finance', techStack: ['Next.js', 'Drizzle', 'PDF'], complexity: 'intermediate', hasAI: false },
  { id: '18-billable-hours', title: 'Billable Hours', description: 'Track billable time for client projects', category: 'finance', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'intermediate', hasAI: false },

  // HR
  { id: '04-time-tracker', title: 'Time Tracker', description: 'Employee time tracking and reporting', category: 'hr', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'starter', hasAI: false },

  // Legal
  { id: '16-client-intake', title: 'Client Intake', description: 'Professional services client onboarding with AI document extraction', category: 'legal', techStack: ['Next.js', 'Drizzle', 'AI SDK'], complexity: 'advanced', hasAI: true },

  // Scheduling
  { id: '03-meeting-scheduler', title: 'Meeting Scheduler', description: 'Schedule and manage meetings', category: 'scheduling', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'starter', hasAI: false },
  { id: '26-service-appointments', title: 'Service Appointments', description: 'Service booking and appointment management', category: 'scheduling', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'intermediate', hasAI: false },
  { id: '27-event-registration', title: 'Event Registration', description: 'Event signup and attendee management', category: 'scheduling', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'intermediate', hasAI: false },

  // Sales
  { id: '28-job-board-ats', title: 'Job Board ATS', description: 'Applicant tracking system for job postings', category: 'sales', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'advanced', hasAI: false },

  // Logistics
  { id: '36-delivery-route-planning', title: 'Delivery Route Planning', description: 'Optimize delivery routes and schedules', category: 'logistics', techStack: ['Next.js', 'Drizzle', 'Maps API'], complexity: 'advanced', hasAI: false },

  // Misc
  { id: '5-resource-booking', title: 'Resource Booking', description: 'Book rooms, equipment, and shared resources', category: 'misc', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'starter', hasAI: false },
  { id: '6-approval-workflow', title: 'Approval Workflow', description: 'Multi-step approval processes', category: 'misc', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'intermediate', hasAI: false },
  { id: '8-lead-tracking', title: 'Lead Tracking', description: 'Track sales leads and opportunities', category: 'misc', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'starter', hasAI: false },
  { id: '46-campaign-management', title: 'Campaign Management', description: 'Marketing campaign planning and tracking', category: 'misc', techStack: ['Next.js', 'Drizzle', 'SQLite'], complexity: 'intermediate', hasAI: false },
]

export function getDemoBySlug(slug: string): Demo | undefined {
  return DEMOS.find(d => d.slug === slug)
}

export function getTemplatesByCategory(category: string): Template[] {
  return TEMPLATES.filter(t => t.category === category)
}
