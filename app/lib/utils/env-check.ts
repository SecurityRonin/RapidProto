/**
 * Environment validation - fail fast on missing config
 * Call at startup before database/service initialization
 */

const requiredEnvVars = [
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'TURSO_DATABASE_URL',
  'TURSO_AUTH_TOKEN',
] as const

const optionalEnvVars = [
  'RESEND_API_KEY',
  'VERCEL_URL',
  'NEXT_PUBLIC_APP_URL',
] as const

export class EnvValidationError extends Error {
  constructor(missing: string[]) {
    super(
      `Missing required environment variables:\n` +
      missing.map(k => `  - ${k}`).join('\n') +
      `\n\nCopy .env.example to .env.local and fill in values.`
    )
    this.name = 'EnvValidationError'
  }
}

export function validateEnv(): void {
  const missing = requiredEnvVars.filter(key => !process.env[key])

  if (missing.length > 0) {
    throw new EnvValidationError(missing)
  }

  // Warn about optional but recommended vars in development
  const missingOptional = optionalEnvVars.filter(key => !process.env[key])
  if (missingOptional.length > 0 && process.env.NODE_ENV === 'development') {
    console.warn(
      `[env] Optional environment variables not set: ${missingOptional.join(', ')}`
    )
  }
}

// Type-safe environment access
// Use functions to defer access until after validation
export const env = {
  clerk: {
    publishableKey: () => process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!,
    secretKey: () => process.env.CLERK_SECRET_KEY!,
  },
  turso: {
    url: () => process.env.TURSO_DATABASE_URL!,
    token: () => process.env.TURSO_AUTH_TOKEN!,
  },
  resend: {
    apiKey: () => process.env.RESEND_API_KEY,
  },
  app: {
    url: () =>
      process.env.NEXT_PUBLIC_APP_URL ||
      process.env.VERCEL_URL ||
      'http://localhost:3000',
  },
} as const
