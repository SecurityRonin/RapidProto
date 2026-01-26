import '@testing-library/jest-dom'
import React from 'react'
import { vi } from 'vitest'

// Make React available globally for JSX
globalThis.React = React

// Mock Clerk auth globally
vi.mock('@clerk/nextjs', () => ({
  auth: () => ({ userId: 'test_user_123' }),
  currentUser: () => Promise.resolve({ id: 'test_user_123', firstName: 'Test' }),
}))
