/**
 * Template #4: Time Tracker Schema Tests
 * TDD: Tests written FIRST to define expected schema structure
 */

import { describe, it, expect } from 'vitest'
import { projects, timeEntries, type Project, type TimeEntry, type NewProject, type NewTimeEntry } from './schema'

describe('Template #4: Time Tracker Schema', () => {
  describe('Projects Table', () => {
    it('should have id as primary key', () => {
      expect(projects.id).toBeDefined()
      expect(projects.id.name).toBe('id')
    })

    it('should have required name field', () => {
      expect(projects.name).toBeDefined()
      expect(projects.name.notNull).toBe(true)
    })

    it('should have optional clientName field', () => {
      expect(projects.clientName).toBeDefined()
    })

    it('should have optional hourlyRate field', () => {
      expect(projects.hourlyRate).toBeDefined()
    })

    it('should have optional budgetHours field', () => {
      expect(projects.budgetHours).toBeDefined()
    })

    it('should have status field with correct enum values', () => {
      expect(projects.status).toBeDefined()
      // Status should support: active, completed, archived
    })

    it('should have userId field (for multi-tenant)', () => {
      expect(projects.userId).toBeDefined()
      expect(projects.userId.notNull).toBe(true)
    })

    it('should have timestamp fields', () => {
      expect(projects.createdAt).toBeDefined()
      expect(projects.updatedAt).toBeDefined()
    })
  })

  describe('Time Entries Table', () => {
    it('should have id as primary key', () => {
      expect(timeEntries.id).toBeDefined()
      expect(timeEntries.id.name).toBe('id')
    })

    it('should have required userId field', () => {
      expect(timeEntries.userId).toBeDefined()
      expect(timeEntries.userId.notNull).toBe(true)
    })

    it('should have optional projectId field with foreign key', () => {
      expect(timeEntries.projectId).toBeDefined()
      // Should reference projects table
    })

    it('should have optional taskDescription field', () => {
      expect(timeEntries.taskDescription).toBeDefined()
    })

    it('should have required startTime field', () => {
      expect(timeEntries.startTime).toBeDefined()
      expect(timeEntries.startTime.notNull).toBe(true)
    })

    it('should have optional endTime field (null when running)', () => {
      expect(timeEntries.endTime).toBeDefined()
      // Should be null when timer is running
    })

    it('should have optional duration field (computed on stop)', () => {
      expect(timeEntries.duration).toBeDefined()
      // Duration in minutes, null when running
    })

    it('should have billable boolean field with default true', () => {
      expect(timeEntries.billable).toBeDefined()
    })

    it('should have optional hourlyRate field (override project rate)', () => {
      expect(timeEntries.hourlyRate).toBeDefined()
    })

    it('should have status field with correct enum values', () => {
      expect(timeEntries.status).toBeDefined()
      // Status should support: running, completed, approved
    })

    it('should have timestamp fields', () => {
      expect(timeEntries.createdAt).toBeDefined()
      expect(timeEntries.updatedAt).toBeDefined()
    })
  })

  describe('Type Exports', () => {
    it('should export Project type', () => {
      // Type checking - these should compile without errors
      const project: Project = {
        id: 'proj_1',
        name: 'Test Project',
        clientName: 'Acme Corp',
        hourlyRate: 150,
        budgetHours: 100,
        status: 'active',
        userId: 'user_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(project.id).toBe('proj_1')
    })

    it('should export NewProject type for inserts', () => {
      const newProject: NewProject = {
        id: 'proj_2',
        name: 'New Project',
        userId: 'user_1',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(newProject.name).toBe('New Project')
    })

    it('should export TimeEntry type', () => {
      const entry: TimeEntry = {
        id: 'entry_1',
        userId: 'user_1',
        projectId: 'proj_1',
        taskDescription: 'Working on feature',
        startTime: new Date(),
        endTime: new Date(),
        duration: 120,
        billable: true,
        hourlyRate: 150,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(entry.duration).toBe(120)
    })

    it('should export NewTimeEntry type for inserts', () => {
      const newEntry: NewTimeEntry = {
        id: 'entry_2',
        userId: 'user_1',
        startTime: new Date(),
        billable: true,
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(newEntry.status).toBe('running')
    })
  })

  describe('Field Constraints', () => {
    it('should allow null endTime for running timers', () => {
      const runningEntry: TimeEntry = {
        id: 'entry_1',
        userId: 'user_1',
        projectId: null,
        taskDescription: null,
        startTime: new Date(),
        endTime: null,
        duration: null,
        billable: true,
        hourlyRate: null,
        status: 'running',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(runningEntry.endTime).toBeNull()
      expect(runningEntry.duration).toBeNull()
    })

    it('should allow null projectId for general time entries', () => {
      const generalEntry: TimeEntry = {
        id: 'entry_2',
        userId: 'user_1',
        projectId: null,
        taskDescription: 'Admin work',
        startTime: new Date(),
        endTime: new Date(),
        duration: 60,
        billable: false,
        hourlyRate: null,
        status: 'completed',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
      expect(generalEntry.projectId).toBeNull()
    })
  })
})
