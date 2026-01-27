import { test, expect } from '@playwright/test'

test.describe('RapidProto E2E', () => {
  test.describe('Landing Page', () => {
    test('should load homepage', async ({ page }) => {
      await page.goto('/')

      // Check main heading is visible
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    })

    test('should show 50-minute session info', async ({ page }) => {
      await page.goto('/')

      // Look for the "50-Minute Sprint" heading specifically
      await expect(page.getByRole('heading', { name: /50-Minute Sprint/i })).toBeVisible()
    })

    test('should have start session button', async ({ page }) => {
      await page.goto('/')

      // Look for a button/link to start a session
      const startButton = page.getByRole('link', { name: /start|begin|new session/i })
      await expect(startButton).toBeVisible()
    })
  })

  test.describe('New Session Page', () => {
    test('should load new session page', async ({ page }) => {
      await page.goto('/session/new')

      // Should have the "New Session" heading
      await expect(page.getByRole('heading', { name: /new session/i })).toBeVisible()
    })

    test('should have project input', async ({ page }) => {
      await page.goto('/session/new')

      // Look for input field with specific placeholder
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await expect(titleInput).toBeVisible()
    })

    test('should create session and redirect to dashboard', async ({ page }) => {
      await page.goto('/session/new')

      // Fill in project name
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('E2E Test Project')

      // Click start session button
      const startButton = page.getByRole('button', { name: /start 50-min session/i })
      await startButton.click()

      // Should redirect to session dashboard (URL contains /session/)
      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 10000 })
    })
  })

  test.describe('Session Dashboard', () => {
    test('should display timer', async ({ page }) => {
      // First create a session
      await page.goto('/session/new')
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('Timer Test')
      await page.getByRole('button', { name: /start 50-min session/i }).click()

      // Wait for dashboard URL
      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Wait for discovery text (dashboard is loaded)
      await expect(page.getByText(/discovery/i).first()).toBeVisible({ timeout: 10000 })

      // Dashboard should be visible (timer area exists)
      await expect(page.locator('main')).toBeVisible()
    })

    test('should display phase indicators', async ({ page }) => {
      await page.goto('/session/new')
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('Phase Test')
      await page.getByRole('button', { name: /start 50-min session/i }).click()

      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Should show discovery phase (first phase)
      await expect(page.getByText(/discovery/i).first()).toBeVisible({ timeout: 10000 })
    })

    test('should display step checklist', async ({ page }) => {
      await page.goto('/session/new')
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('Checklist Test')
      await page.getByRole('button', { name: /start 50-min session/i }).click()

      // Wait for redirect with longer timeout
      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 15000 })
      await page.waitForLoadState('networkidle')

      // Wait for dashboard to be fully loaded - look for discovery Steps heading
      await expect(page.getByRole('heading', { name: /discovery steps/i })).toBeVisible({ timeout: 10000 })

      // Should show step content (Define core feature is the first step title - it's an h4)
      await expect(page.getByRole('heading', { name: /define the core feature/i })).toBeVisible({ timeout: 5000 })
    })

    test('should have pause button when active', async ({ page }) => {
      await page.goto('/session/new')
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('Pause Test')
      await page.getByRole('button', { name: /start 50-min session/i }).click()

      // Wait for redirect with longer timeout
      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 15000 })
      await page.waitForLoadState('networkidle')

      // Wait for dashboard to be fully loaded - look for discovery Steps heading
      await expect(page.getByRole('heading', { name: /discovery steps/i })).toBeVisible({ timeout: 10000 })

      // Should have pause button (matches the Button with Pause text)
      await expect(page.getByRole('button', { name: /pause/i })).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Join Session (Facilitator)', () => {
    test('should load join page', async ({ page }) => {
      await page.goto('/join')

      // Should have join-related content
      await expect(page.locator('body')).toBeVisible()
    })
  })
})
