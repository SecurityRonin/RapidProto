/**
 * Auth wrapper for testability
 * Allows tests to override the auth provider without touching server actions
 */

import { auth as clerkAuth } from '@clerk/nextjs/server'

type AuthProvider = () => { userId: string | null }
let authProvider: AuthProvider = clerkAuth

export function setAuthProvider(provider: AuthProvider) {
  authProvider = provider
}

export function resetAuthProvider() {
  authProvider = clerkAuth
}

export function auth() {
  return authProvider()
}
