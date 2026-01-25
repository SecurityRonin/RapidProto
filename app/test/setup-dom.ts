/**
 * Vitest Setup for JSDOM Environment (Component Tests)
 * Mocks server actions at the boundary (Option 3)
 */

import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Make React available globally for JSX
globalThis.React = React

// Mock Clerk auth globally
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test_user_123' }),
  currentUser: () => Promise.resolve({ id: 'test_user_123', firstName: 'Test' }),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({ userId: 'test_user_123', isLoaded: true }),
  useUser: () => ({ user: { id: 'test_user_123', firstName: 'Test' }, isLoaded: true }),
}))

// Mock server actions with meaningful default data
// Individual tests can override using vi.mocked()
vi.mock('@/lib/actions', () => ({
  createSession: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      id: 'session_test',
      role: 'builder',
      status: 'active',
      currentPhase: 'discovery',
      steps: [],
    },
  })),
  pauseSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'paused' } })),
  resumeSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'active' } })),
  advancePhase: vi.fn(() => Promise.resolve({ success: true, data: { currentPhase: 'build' } })),
  completeSession: vi.fn(() => Promise.resolve({ success: true, data: { status: 'completed' } })),
  updateStep: vi.fn(() => Promise.resolve({ success: true, data: {} })),
  saveClientInfo: vi.fn(() => Promise.resolve({ success: true, data: {} })),
  addTemplateSelection: vi.fn(() => Promise.resolve({ success: true, data: {} })),
  addNote: vi.fn(() => Promise.resolve({ success: true, data: {} })),
  getSessionStatus: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      session: {
        id: 'session_test',
        role: 'builder',
        status: 'active',
        currentPhase: 'discovery',
      },
      currentPhase: 'discovery',
      timeRemaining: {
        phase: 'discovery',
        totalMinutes: 10,
        elapsedMinutes: 2,
        remainingMinutes: 8,
        isOvertime: false,
        overtimeMinutes: 0,
      },
      stepsCompleted: 1,
      stepsTotal: 3,
      clientInfo: null,
      selectedTemplate: null,
    },
  })),
  getTimeRemaining: vi.fn(() => Promise.resolve({
    success: true,
    data: {
      phase: 'discovery',
      totalMinutes: 10,
      elapsedMinutes: 2,
      remainingMinutes: 8,
      isOvertime: false,
      overtimeMinutes: 0,
    },
  })),
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock window.matchMedia for responsive components
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))
