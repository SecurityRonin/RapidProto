/**
 * TDD: Template Selector Component Tests
 * Tests component behavior with mocked server actions (Option 3)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { TemplateSelector } from '../../components/session/template-selector'

// Mock server actions
vi.mock('@/lib/actions', () => ({
  addTemplateSelection: vi.fn(() => Promise.resolve({ success: true })),
}))

describe('TemplateSelector', () => {
  const mockTemplates = [
    { number: 1, name: 'Expense Tracker', category: 'Finance', buildTime: 20 },
    { number: 2, name: 'Invoice Generator', category: 'Finance', buildTime: 25 },
    { number: 14, name: 'Inventory Management', category: 'Operations', buildTime: 30 },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Template List', () => {
    it('should display available templates', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      expect(screen.getByText('Expense Tracker')).toBeInTheDocument()
      expect(screen.getByText('Invoice Generator')).toBeInTheDocument()
      expect(screen.getByText('Inventory Management')).toBeInTheDocument()
    })

    it('should show template numbers', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      expect(screen.getByText('#1')).toBeInTheDocument()
      expect(screen.getByText('#2')).toBeInTheDocument()
      expect(screen.getByText('#14')).toBeInTheDocument()
    })

    it('should display build time estimates', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Use getAllByText since times may appear in multiple places (cards + filters)
      expect(screen.getAllByText(/20 min/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/25 min/).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/30 min/).length).toBeGreaterThan(0)
    })

    it('should show category badges', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Finance appears in both filter dropdown options and template badges
      expect(screen.getAllByText('Finance').length).toBeGreaterThanOrEqual(2)
      // Operations also appears in dropdown and badge
      expect(screen.getAllByText('Operations').length).toBeGreaterThanOrEqual(1)
    })
  })

  describe('Search and Filter', () => {
    it('should have search input', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      expect(screen.getByPlaceholderText(/search templates/i)).toBeInTheDocument()
    })

    it('should filter templates by name', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const searchInput = screen.getByPlaceholderText(/search templates/i)
      fireEvent.change(searchInput, { target: { value: 'invoice' } })

      await waitFor(() => {
        expect(screen.getByText('Invoice Generator')).toBeInTheDocument()
        expect(screen.queryByText('Expense Tracker')).not.toBeInTheDocument()
      })
    })

    it('should filter by category', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const categoryFilter = screen.getByLabelText(/category/i)
      fireEvent.change(categoryFilter, { target: { value: 'Finance' } })

      await waitFor(() => {
        expect(screen.getByText('Expense Tracker')).toBeInTheDocument()
        expect(screen.getByText('Invoice Generator')).toBeInTheDocument()
        expect(screen.queryByText('Inventory Management')).not.toBeInTheDocument()
      })
    })

    it('should filter by build time range', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const timeFilter = screen.getByLabelText(/build time/i)
      fireEvent.change(timeFilter, { target: { value: '0-25' } })

      await waitFor(() => {
        expect(screen.getByText('Expense Tracker')).toBeInTheDocument()
        expect(screen.getByText('Invoice Generator')).toBeInTheDocument()
        expect(screen.queryByText('Inventory Management')).not.toBeInTheDocument()
      })
    })
  })

  describe('Template Selection', () => {
    it('should allow selecting a template', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Find and click the Select button on a template
      const template = screen.getByTestId('template-14')
      const selectButton = within(template).getByRole('button', { name: /select/i })
      fireEvent.click(selectButton)

      // Should open the selection modal
      await waitFor(() => {
        expect(screen.getByText('Confirm Selection')).toBeInTheDocument()
      })
    })

    it('should show selection modal with details', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Filter to only Select buttons (not Preview buttons)
      const selectButtons = screen.getAllByRole('button', { name: /^select$/i })
      fireEvent.click(selectButtons[selectButtons.length - 1]) // Last one is Inventory Management

      await waitFor(() => {
        expect(screen.getByText('Confirm Selection')).toBeInTheDocument()
        // Modal shows template number and name - check for the modal-specific element
        expect(screen.getByText(/#14.*Inventory Management/i)).toBeInTheDocument()
      })
    })

    it('should allow fit scoring (1-10)', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const selectButtons = screen.getAllByRole('button', { name: /select/i })
      fireEvent.click(selectButtons[0])

      const fitScoreInput = await screen.findByLabelText(/fit score/i)
      expect(fitScoreInput).toHaveAttribute('type', 'number')
      expect(fitScoreInput).toHaveAttribute('min', '1')
      expect(fitScoreInput).toHaveAttribute('max', '10')
    })

    it('should allow adding fit reason', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const selectButtons = screen.getAllByRole('button', { name: /select/i })
      fireEvent.click(selectButtons[0])

      expect(await screen.findByLabelText(/why this template/i)).toBeInTheDocument()
    })

    it('should allow customization notes', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const selectButtons = screen.getAllByRole('button', { name: /select/i })
      fireEvent.click(selectButtons[0])

      expect(await screen.findByLabelText(/customization notes/i)).toBeInTheDocument()
    })

    it('should save template selection', async () => {
      const { addTemplateSelection } = await import('@/lib/actions')

      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Select Inventory Management (last template)
      const selectButtons = screen.getAllByRole('button', { name: /select/i })
      fireEvent.click(selectButtons[selectButtons.length - 1])

      const fitScore = await screen.findByLabelText(/fit score/i)
      fireEvent.change(fitScore, { target: { value: '9' } })

      const confirmButton = screen.getByRole('button', { name: /confirm/i })
      fireEvent.click(confirmButton)

      await waitFor(() => {
        expect(addTemplateSelection).toHaveBeenCalledWith('session_123', expect.objectContaining({
          templateNumber: 14,
          templateName: 'Inventory Management',
          fitScore: 9,
          isSelected: true,
        }))
      })
    })
  })

  describe('AI Suggestions', () => {
    it('should display AI-suggested templates', () => {
      const withAI = [
        { ...mockTemplates[2], aiSuggested: true, aiReasoning: 'Matches inventory keywords' },
      ]

      render(<TemplateSelector sessionId="session_123" templates={withAI} />)

      expect(screen.getByText(/ai suggested/i)).toBeInTheDocument()
    })

    it('should show AI reasoning on hover', async () => {
      const withAI = [
        { ...mockTemplates[2], aiSuggested: true, aiReasoning: 'Matches inventory keywords' },
      ]

      render(<TemplateSelector sessionId="session_123" templates={withAI} />)

      const aiBadge = screen.getByText(/ai suggested/i)
      fireEvent.mouseEnter(aiBadge)

      await waitFor(() => {
        expect(screen.getByText(/matches inventory keywords/i)).toBeInTheDocument()
      })
    })
  })

  describe('Template Comparison', () => {
    it('should allow comparing multiple templates', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Compare button exists
      const compareButton = screen.getByRole('button', { name: /compare/i })
      expect(compareButton).toBeInTheDocument()
    })

    it('should show comparison checkboxes when compare mode enabled', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Enable compare mode first
      const compareButton = screen.getByRole('button', { name: /compare/i })
      fireEvent.click(compareButton)

      // Now checkboxes should appear
      const checkboxes = screen.getAllByRole('checkbox', { name: /compare/i })
      expect(checkboxes.length).toBe(mockTemplates.length)
    })

    it('should display comparison table', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      // Enable compare mode
      const compareButton = screen.getByRole('button', { name: /compare/i })
      fireEvent.click(compareButton)

      // Select templates to compare
      const checkboxes = screen.getAllByRole('checkbox', { name: /compare/i })
      fireEvent.click(checkboxes[0])
      fireEvent.click(checkboxes[1])

      // Table appears automatically when templates are selected for comparison
      await waitFor(() => {
        expect(screen.getByRole('table')).toBeInTheDocument()
      })
    })
  })

  describe('Previously Considered Templates', () => {
    const withPrevious = [
      {
        id: 'sel_1',
        templateNumber: 1,
        templateName: 'Expense Tracker',
        fitScore: 7,
        fitReason: 'Good for finance',
        isSelected: false,
      },
    ]

    it('should show previously considered templates', () => {
      render(
        <TemplateSelector
          sessionId="session_123"
          templates={mockTemplates}
          previousSelections={withPrevious}
        />
      )

      expect(screen.getByText(/previously considered/i)).toBeInTheDocument()
    })

    it('should display fit scores for considered templates', () => {
      render(
        <TemplateSelector
          sessionId="session_123"
          templates={mockTemplates}
          previousSelections={withPrevious}
        />
      )

      expect(screen.getByText(/fit: 7\/10/i)).toBeInTheDocument()
    })

    it('should show selected template badge', () => {
      const withSelected = [
        { ...withPrevious[0], isSelected: true },
      ]

      render(
        <TemplateSelector
          sessionId="session_123"
          templates={mockTemplates}
          previousSelections={withSelected}
        />
      )

      expect(screen.getByText(/selected/i)).toBeInTheDocument()
    })
  })

  describe('Quick Actions', () => {
    it('should have preview button for each template', () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const previewButtons = screen.getAllByRole('button', { name: /preview/i })
      expect(previewButtons.length).toBe(mockTemplates.length)
    })

    it('should show template preview modal', async () => {
      render(<TemplateSelector sessionId="session_123" templates={mockTemplates} />)

      const previewButtons = screen.getAllByRole('button', { name: /preview/i })
      fireEvent.click(previewButtons[0])

      await waitFor(() => {
        // Modal appears with heading and template details
        const heading = screen.getAllByText('Template Preview')[0]
        expect(heading.tagName).toBe('H2')
        // Shows Select This Template button (modal-only element)
        expect(screen.getByRole('button', { name: /select this template/i })).toBeInTheDocument()
      })
    })
  })
})
