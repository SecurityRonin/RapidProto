import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = 'pk_test_mock'
process.env.CLERK_SECRET_KEY = 'sk_test_mock'
process.env.TURSO_DATABASE_URL = 'file:test.db'
process.env.TURSO_AUTH_TOKEN = 'test-token'
process.env.RESEND_API_KEY = 're_mock'

// Mock Clerk
vi.mock('@clerk/nextjs', () => ({
  auth: vi.fn(() => ({
    userId: 'user_test123',
    sessionId: 'sess_test123',
  })),
  currentUser: vi.fn(() => ({
    id: 'user_test123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User',
  })),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useUser: vi.fn(() => ({
    isSignedIn: true,
    user: {
      id: 'user_test123',
      emailAddresses: [{ emailAddress: 'test@example.com' }],
      firstName: 'Test',
      lastName: 'User',
    },
  })),
  SignInButton: ({ children }: { children?: React.ReactNode }) => (
    <button>{children || 'Sign In'}</button>
  ),
  SignOutButton: ({ children }: { children?: React.ReactNode }) => (
    <button>{children || 'Sign Out'}</button>
  ),
  UserButton: () => <div>User Button</div>,
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: vi.fn(() => '/'),
  useSearchParams: vi.fn(() => new URLSearchParams()),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

// Mock Resend
vi.mock('resend', () => ({
  Resend: vi.fn(() => ({
    emails: {
      send: vi.fn(() => Promise.resolve({ id: 'email_test123' })),
    },
  })),
}))

// Mock Vercel Blob
vi.mock('@vercel/blob', () => ({
  put: vi.fn(() =>
    Promise.resolve({
      url: 'https://blob.vercel-storage.com/test-file.png',
      downloadUrl: 'https://blob.vercel-storage.com/test-file.png',
      pathname: 'test-file.png',
    })
  ),
  del: vi.fn(() => Promise.resolve()),
  list: vi.fn(() => Promise.resolve({ blobs: [] })),
}))

// Global test utilities
global.fetch = vi.fn()

// Reset all mocks between tests
beforeEach(() => {
  vi.clearAllMocks()
})
