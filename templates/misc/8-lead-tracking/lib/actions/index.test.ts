/**
 * Tests for Template #8: Lead Tracking actions
 * TDD: Tests written first, then implementation
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest'

// Mock database - must be before imports
const mockDb = {
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
}

vi.mock('@/lib/db', () => ({
  db: mockDb,
}))

// Import after mocking
import {
  createLead,
  getLeads,
  getLeadById,
  updateLead,
  updateLeadStatus,
  assignLead,
  addActivity,
  scheduleActivity,
  completeActivity,
  getLeadsByStage,
  getLeadConversionRate,
  getLeadsBySource,
  getOverdueFollowUps,
  createLeadSchema,
  addActivitySchema,
  scheduleActivitySchema,
  LeadSource,
  LeadStatus,
  ActivityType,
} from './index'

// Helper to create mock lead data
const mockLead = (overrides = {}) => ({
  id: 'lead_123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890',
  company: 'Acme Corp',
  source: 'web' as LeadSource,
  status: 'new' as LeadStatus,
  value: 10000,
  assignedTo: 'user_456',
  notes: 'Interested in premium plan',
  lastContactedAt: null,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
})

const mockActivity = (overrides = {}) => ({
  id: 'activity_123',
  leadId: 'lead_123',
  type: 'call' as ActivityType,
  description: 'Initial discovery call',
  scheduledAt: null,
  completedAt: new Date('2024-01-15'),
  userId: 'user_456',
  createdAt: new Date('2024-01-15'),
  ...overrides,
})

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})

describe('Template #8: Lead Tracking Actions', () => {
  describe('Validation Schemas', () => {
    describe('createLeadSchema', () => {
      it('should validate a complete lead', () => {
        const validLead = {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          company: 'Acme Corp',
          source: 'web',
          value: 10000,
          notes: 'Test notes',
        }
        expect(() => createLeadSchema.parse(validLead)).not.toThrow()
      })

      it('should require name', () => {
        const invalidLead = {
          email: 'john@example.com',
          source: 'web',
        }
        expect(() => createLeadSchema.parse(invalidLead)).toThrow()
      })

      it('should validate email format', () => {
        const invalidLead = {
          name: 'John Doe',
          email: 'not-an-email',
          source: 'web',
        }
        expect(() => createLeadSchema.parse(invalidLead)).toThrow()
      })

      it('should validate source enum', () => {
        const invalidLead = {
          name: 'John Doe',
          source: 'invalid-source',
        }
        expect(() => createLeadSchema.parse(invalidLead)).toThrow()
      })

      it('should allow optional fields', () => {
        const minimalLead = {
          name: 'John Doe',
          source: 'web',
        }
        expect(() => createLeadSchema.parse(minimalLead)).not.toThrow()
      })

      it('should validate value is non-negative', () => {
        const invalidLead = {
          name: 'John Doe',
          source: 'web',
          value: -100,
        }
        expect(() => createLeadSchema.parse(invalidLead)).toThrow()
      })
    })

    describe('addActivitySchema', () => {
      it('should validate a complete activity', () => {
        const validActivity = {
          leadId: 'lead_123',
          type: 'call',
          description: 'Discovery call completed',
          userId: 'user_456',
        }
        expect(() => addActivitySchema.parse(validActivity)).not.toThrow()
      })

      it('should require leadId', () => {
        const invalidActivity = {
          type: 'call',
          description: 'Discovery call',
        }
        expect(() => addActivitySchema.parse(invalidActivity)).toThrow()
      })

      it('should validate type enum', () => {
        const invalidActivity = {
          leadId: 'lead_123',
          type: 'invalid-type',
          description: 'Test',
        }
        expect(() => addActivitySchema.parse(invalidActivity)).toThrow()
      })
    })

    describe('scheduleActivitySchema', () => {
      it('should validate a scheduled activity', () => {
        const validActivity = {
          leadId: 'lead_123',
          type: 'meeting',
          description: 'Demo meeting',
          scheduledAt: new Date('2024-02-01'),
          userId: 'user_456',
        }
        expect(() => scheduleActivitySchema.parse(validActivity)).not.toThrow()
      })

      it('should require scheduledAt', () => {
        const invalidActivity = {
          leadId: 'lead_123',
          type: 'meeting',
          description: 'Demo meeting',
        }
        expect(() => scheduleActivitySchema.parse(invalidActivity)).toThrow()
      })
    })
  })

  describe('createLead', () => {
    it('should create a new lead with valid data', async () => {
      const newLead = mockLead()
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newLead]),
        }),
      })

      const result = await createLead({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'Acme Corp',
        source: 'web',
        value: 10000,
        notes: 'Interested in premium plan',
      })

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.name).toBe('John Doe')
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should set default status to new', async () => {
      const newLead = mockLead({ status: 'new' })
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([newLead]),
        }),
      })

      const result = await createLead({
        name: 'John Doe',
        source: 'web',
      })

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('new')
    })

    it('should reject invalid data', async () => {
      await expect(
        createLead({ name: '', source: 'web' })
      ).rejects.toThrow()
    })
  })

  describe('getLeads', () => {
    it('should return all leads without filters', async () => {
      const leads = [mockLead(), mockLead({ id: 'lead_456', name: 'Jane Doe' })]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(leads),
          orderBy: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(leads),
          }),
        }),
      })

      const result = await getLeads()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
    })

    it('should filter by status', async () => {
      const qualifiedLeads = [mockLead({ status: 'qualified' })]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(qualifiedLeads),
          orderBy: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(qualifiedLeads),
          }),
        }),
      })

      const result = await getLeads({ status: 'qualified' })

      expect(result.success).toBe(true)
      expect(result.data?.[0]?.status).toBe('qualified')
    })

    it('should filter by source', async () => {
      const referralLeads = [mockLead({ source: 'referral' })]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(referralLeads),
          orderBy: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(referralLeads),
          }),
        }),
      })

      const result = await getLeads({ source: 'referral' })

      expect(result.success).toBe(true)
      expect(result.data?.[0]?.source).toBe('referral')
    })

    it('should filter by assignee', async () => {
      const assignedLeads = [mockLead({ assignedTo: 'user_789' })]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(assignedLeads),
          orderBy: vi.fn().mockReturnValue({
            where: vi.fn().mockResolvedValue(assignedLeads),
          }),
        }),
      })

      const result = await getLeads({ assignedTo: 'user_789' })

      expect(result.success).toBe(true)
      expect(result.data?.[0]?.assignedTo).toBe('user_789')
    })
  })

  describe('getLeadById', () => {
    it('should return lead with activities', async () => {
      const lead = mockLead()
      const activities = [mockActivity(), mockActivity({ id: 'activity_456', type: 'email' })]

      mockDb.select.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([lead]),
        }),
      }).mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(activities),
          }),
        }),
      })

      const result = await getLeadById('lead_123')

      expect(result.success).toBe(true)
      expect(result.data?.lead).toBeDefined()
      expect(result.data?.activities).toHaveLength(2)
    })

    it('should return error for non-existent lead', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      })

      const result = await getLeadById('non_existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Lead not found')
    })
  })

  describe('updateLead', () => {
    it('should update lead fields', async () => {
      const updatedLead = mockLead({ company: 'New Company' })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedLead]),
          }),
        }),
      })

      const result = await updateLead('lead_123', { company: 'New Company' })

      expect(result.success).toBe(true)
      expect(result.data?.company).toBe('New Company')
    })

    it('should return error for non-existent lead', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await updateLead('non_existent', { company: 'Test' })

      expect(result.success).toBe(false)
      expect(result.error).toBe('Lead not found')
    })
  })

  describe('updateLeadStatus', () => {
    it('should update status with timestamp', async () => {
      const now = new Date()
      const updatedLead = mockLead({ status: 'contacted', lastContactedAt: now })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([updatedLead]),
          }),
        }),
      })

      const result = await updateLeadStatus('lead_123', 'contacted')

      expect(result.success).toBe(true)
      expect(result.data?.status).toBe('contacted')
      expect(mockDb.update).toHaveBeenCalled()
    })

    it('should validate status transition', async () => {
      // Won/lost are terminal - test invalid status
      await expect(
        updateLeadStatus('lead_123', 'invalid-status' as LeadStatus)
      ).rejects.toThrow()
    })
  })

  describe('assignLead', () => {
    it('should assign lead to user', async () => {
      const assignedLead = mockLead({ assignedTo: 'user_new' })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([assignedLead]),
          }),
        }),
      })

      const result = await assignLead('lead_123', 'user_new')

      expect(result.success).toBe(true)
      expect(result.data?.assignedTo).toBe('user_new')
    })

    it('should allow unassigning by passing null', async () => {
      const unassignedLead = mockLead({ assignedTo: null })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([unassignedLead]),
          }),
        }),
      })

      const result = await assignLead('lead_123', null)

      expect(result.success).toBe(true)
      expect(result.data?.assignedTo).toBeNull()
    })
  })

  describe('addActivity', () => {
    it('should log an activity for a lead', async () => {
      const activity = mockActivity()
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([activity]),
        }),
      })
      // Mock the lead update for lastContactedAt
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockLead()]),
          }),
        }),
      })

      const result = await addActivity({
        leadId: 'lead_123',
        type: 'call',
        description: 'Initial discovery call',
        userId: 'user_456',
      })

      expect(result.success).toBe(true)
      expect(result.data?.type).toBe('call')
      expect(mockDb.insert).toHaveBeenCalled()
    })

    it('should update lastContactedAt on lead', async () => {
      const activity = mockActivity()
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([activity]),
        }),
      })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([mockLead()]),
          }),
        }),
      })

      await addActivity({
        leadId: 'lead_123',
        type: 'call',
        description: 'Call completed',
        userId: 'user_456',
      })

      expect(mockDb.update).toHaveBeenCalled()
    })
  })

  describe('scheduleActivity', () => {
    it('should schedule a future activity', async () => {
      const scheduledActivity = mockActivity({
        scheduledAt: new Date('2024-02-01'),
        completedAt: null,
      })
      mockDb.insert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([scheduledActivity]),
        }),
      })

      const result = await scheduleActivity({
        leadId: 'lead_123',
        type: 'meeting',
        description: 'Demo meeting',
        scheduledAt: new Date('2024-02-01'),
        userId: 'user_456',
      })

      expect(result.success).toBe(true)
      expect(result.data?.scheduledAt).toBeDefined()
      expect(result.data?.completedAt).toBeNull()
    })
  })

  describe('completeActivity', () => {
    it('should mark activity as completed', async () => {
      const now = new Date()
      const completedActivity = mockActivity({ completedAt: now })
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([completedActivity]),
          }),
        }),
      })
      // Mock lead update
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([mockActivity()]),
        }),
      })

      const result = await completeActivity('activity_123')

      expect(result.success).toBe(true)
      expect(result.data?.completedAt).toBeDefined()
    })

    it('should return error for non-existent activity', async () => {
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await completeActivity('non_existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Activity not found')
    })
  })

  describe('getLeadsByStage (Pipeline View)', () => {
    it('should return count and value per stage', async () => {
      const leads = [
        mockLead({ status: 'new', value: 5000 }),
        mockLead({ id: 'lead_2', status: 'new', value: 3000 }),
        mockLead({ id: 'lead_3', status: 'qualified', value: 15000 }),
        mockLead({ id: 'lead_4', status: 'proposal', value: 25000 }),
        mockLead({ id: 'lead_5', status: 'won', value: 20000 }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(leads),
      })

      const result = await getLeadsByStage()

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.new?.count).toBe(2)
      expect(result.data?.new?.value).toBe(8000)
      expect(result.data?.qualified?.count).toBe(1)
      expect(result.data?.qualified?.value).toBe(15000)
      expect(result.data?.proposal?.count).toBe(1)
      expect(result.data?.won?.count).toBe(1)
    })

    it('should return zero counts for empty stages', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([]),
      })

      const result = await getLeadsByStage()

      expect(result.success).toBe(true)
      expect(result.data?.new?.count).toBe(0)
      expect(result.data?.contacted?.count).toBe(0)
    })
  })

  describe('getLeadConversionRate', () => {
    it('should calculate won vs total percentage', async () => {
      const leads = [
        mockLead({ status: 'won' }),
        mockLead({ id: 'lead_2', status: 'won' }),
        mockLead({ id: 'lead_3', status: 'lost' }),
        mockLead({ id: 'lead_4', status: 'qualified' }),
        mockLead({ id: 'lead_5', status: 'new' }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(leads),
      })

      const result = await getLeadConversionRate()

      expect(result.success).toBe(true)
      expect(result.data?.totalLeads).toBe(5)
      expect(result.data?.wonLeads).toBe(2)
      expect(result.data?.lostLeads).toBe(1)
      expect(result.data?.conversionRate).toBe(40) // 2/5 = 40%
    })

    it('should handle zero leads', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue([]),
      })

      const result = await getLeadConversionRate()

      expect(result.success).toBe(true)
      expect(result.data?.totalLeads).toBe(0)
      expect(result.data?.conversionRate).toBe(0)
    })

    it('should calculate win rate from closed deals', async () => {
      const leads = [
        mockLead({ status: 'won' }),
        mockLead({ id: 'lead_2', status: 'lost' }),
        mockLead({ id: 'lead_3', status: 'lost' }),
        mockLead({ id: 'lead_4', status: 'qualified' }), // Not closed
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(leads),
      })

      const result = await getLeadConversionRate()

      expect(result.success).toBe(true)
      expect(result.data?.closedDeals).toBe(3) // won + lost
      expect(result.data?.winRate).toBeCloseTo(33.33, 1) // 1/3
    })
  })

  describe('getLeadsBySource', () => {
    it('should group leads by source with counts and values', async () => {
      const leads = [
        mockLead({ source: 'web', value: 5000 }),
        mockLead({ id: 'lead_2', source: 'web', value: 3000 }),
        mockLead({ id: 'lead_3', source: 'referral', value: 15000 }),
        mockLead({ id: 'lead_4', source: 'event', value: 10000 }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(leads),
      })

      const result = await getLeadsBySource()

      expect(result.success).toBe(true)
      expect(result.data?.web?.count).toBe(2)
      expect(result.data?.web?.totalValue).toBe(8000)
      expect(result.data?.referral?.count).toBe(1)
      expect(result.data?.referral?.totalValue).toBe(15000)
    })

    it('should calculate conversion rate per source', async () => {
      const leads = [
        mockLead({ source: 'web', status: 'won', value: 5000 }),
        mockLead({ id: 'lead_2', source: 'web', status: 'lost', value: 3000 }),
        mockLead({ id: 'lead_3', source: 'referral', status: 'won', value: 15000 }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockResolvedValue(leads),
      })

      const result = await getLeadsBySource()

      expect(result.success).toBe(true)
      expect(result.data?.web?.conversionRate).toBe(50) // 1 won / 2 total
      expect(result.data?.referral?.conversionRate).toBe(100) // 1 won / 1 total
    })
  })

  describe('getOverdueFollowUps', () => {
    it('should return scheduled activities past due', async () => {
      const overdueActivities = [
        mockActivity({
          scheduledAt: new Date('2024-01-01'),
          completedAt: null,
        }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(overdueActivities),
          }),
        }),
      })

      const result = await getOverdueFollowUps()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(1)
      expect(result.data?.[0]?.completedAt).toBeNull()
    })

    it('should not include completed activities', async () => {
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue([]),
          }),
        }),
      })

      const result = await getOverdueFollowUps()

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(0)
    })

    it('should filter by assignee if provided', async () => {
      const activities = [
        mockActivity({
          scheduledAt: new Date('2024-01-01'),
          completedAt: null,
          userId: 'user_specific',
        }),
      ]
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(activities),
          }),
        }),
      })

      const result = await getOverdueFollowUps({ userId: 'user_specific' })

      expect(result.success).toBe(true)
      expect(result.data?.[0]?.userId).toBe('user_specific')
    })
  })
})
