/**
 * Tests for Template #8: Lead Tracking schema
 * TDD: Tests written first, then implementation
 */

import { describe, it, expect } from 'vitest'
import { leads, leadActivities, leadSources } from './schema'

describe('Template #8: Lead Tracking Schema', () => {
  describe('Leads Table', () => {
    it('should have id field', () => {
      expect(leads.id).toBeDefined()
    })

    it('should have name field', () => {
      expect(leads.name).toBeDefined()
    })

    it('should have email field', () => {
      expect(leads.email).toBeDefined()
    })

    it('should have phone field', () => {
      expect(leads.phone).toBeDefined()
    })

    it('should have company field', () => {
      expect(leads.company).toBeDefined()
    })

    it('should have source field', () => {
      expect(leads.source).toBeDefined()
    })

    it('should have status field', () => {
      expect(leads.status).toBeDefined()
    })

    it('should have value field', () => {
      expect(leads.value).toBeDefined()
    })

    it('should have assignedTo field', () => {
      expect(leads.assignedTo).toBeDefined()
    })

    it('should have notes field', () => {
      expect(leads.notes).toBeDefined()
    })

    it('should have lastContactedAt field', () => {
      expect(leads.lastContactedAt).toBeDefined()
    })

    it('should have createdAt field', () => {
      expect(leads.createdAt).toBeDefined()
    })

    it('should have updatedAt field', () => {
      expect(leads.updatedAt).toBeDefined()
    })
  })

  describe('Lead Activities Table', () => {
    it('should have id field', () => {
      expect(leadActivities.id).toBeDefined()
    })

    it('should have leadId field', () => {
      expect(leadActivities.leadId).toBeDefined()
    })

    it('should have type field', () => {
      expect(leadActivities.type).toBeDefined()
    })

    it('should have description field', () => {
      expect(leadActivities.description).toBeDefined()
    })

    it('should have scheduledAt field', () => {
      expect(leadActivities.scheduledAt).toBeDefined()
    })

    it('should have completedAt field', () => {
      expect(leadActivities.completedAt).toBeDefined()
    })

    it('should have userId field', () => {
      expect(leadActivities.userId).toBeDefined()
    })

    it('should have createdAt field', () => {
      expect(leadActivities.createdAt).toBeDefined()
    })
  })

  describe('Lead Sources Table', () => {
    it('should have id field', () => {
      expect(leadSources.id).toBeDefined()
    })

    it('should have name field', () => {
      expect(leadSources.name).toBeDefined()
    })

    it('should have campaignId field (optional)', () => {
      expect(leadSources.campaignId).toBeDefined()
    })
  })
})
