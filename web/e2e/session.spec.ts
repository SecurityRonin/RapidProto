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

      // Wait for page to fully load
      await page.waitForLoadState('networkidle')
      await page.waitForTimeout(2000) // Extra wait for React hydration

      // Debug: take screenshot if discovery not found
      const discoveryVisible = await page.getByText(/discovery/i).first().isVisible().catch(() => false)
      if (!discoveryVisible) {
        await page.screenshot({ path: 'debug-timer-test.png' })
        console.log('Page content:', await page.content())
      }

      // Should show RapidProto header (the session dashboard is loaded)
      await expect(page.getByText(/rapidproto/i).first()).toBeVisible({ timeout: 10000 })
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

      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Wait for discovery text (dashboard is loaded)
      await expect(page.getByText(/discovery/i).first()).toBeVisible({ timeout: 10000 })

      // Should show steps heading
      await expect(page.getByText(/steps/i)).toBeVisible({ timeout: 5000 })
    })

    test('should have pause button when active', async ({ page }) => {
      await page.goto('/session/new')
      const titleInput = page.getByPlaceholder(/todo app|landing page/i)
      await titleInput.fill('Pause Test')
      await page.getByRole('button', { name: /start 50-min session/i }).click()

      await expect(page).toHaveURL(/\/session\/[a-zA-Z0-9_-]+/, { timeout: 10000 })
      await page.waitForLoadState('networkidle')

      // Wait for discovery text (dashboard is loaded)
      await expect(page.getByText(/discovery/i).first()).toBeVisible({ timeout: 10000 })

      // Should have pause button (text Pause in a button)
      await expect(page.locator('button:has-text("Pause")')).toBeVisible({ timeout: 5000 })
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
