import { describe, it, expect, vi } from 'vitest'
import { extractClientDataFromDocument } from '../document-extraction'
import { generateText } from 'ai'

/**
 * TDD: AI Document Extraction Tests
 */

vi.mock('ai', () => ({
  generateText: vi.fn(),
}))

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'gpt-4o'),
}))

describe('AI Document Extraction', () => {
  describe('extractClientDataFromDocument', () => {
    it('should extract business information from license', async () => {
      // Mock AI response
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          businessName: 'ACME Corporation',
          licenseNumber: 'BL-123456',
          address: {
            street: '123 Main St',
            city: 'Springfield',
            state: 'IL',
            zip: '62701',
          },
          expiryDate: '2025-12-31',
          type: 'business_license',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: `Business License #BL-123456
ACME Corporation
123 Main St, Springfield, IL 62701
Expires: 12/31/2025`,
        documentType: 'business_license',
      })

      expect(result.success).toBe(true)
      expect(result.data?.businessName).toBe('ACME Corporation')
      expect(result.data?.licenseNumber).toBe('BL-123456')
      expect(result.data?.address?.city).toBe('Springfield')
    })

    it('should extract individual information from ID', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          fullName: 'John Michael Doe',
          dateOfBirth: '1985-06-15',
          address: {
            street: '456 Oak Ave',
            city: 'Portland',
            state: 'OR',
            zip: '97201',
          },
          idNumber: 'DL-987654',
          type: 'drivers_license',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: `DRIVER'S LICENSE
John Michael Doe
DOB: 06/15/1985
456 Oak Ave, Portland, OR 97201
DL#: 987654`,
        documentType: 'id',
      })

      expect(result.success).toBe(true)
      expect(result.data?.fullName).toBe('John Michael Doe')
      expect(result.data?.dateOfBirth).toBe('1985-06-15')
    })

    it('should extract tax information from tax return', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          name: 'Smith Family Trust',
          taxId: '12-3456789',
          taxYear: '2023',
          filingStatus: 'married_filing_jointly',
          income: 150000,
          type: 'tax_return',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: `Form 1040
Tax Year 2023
Smith Family Trust
EIN: 12-3456789
Filing Status: Married Filing Jointly
Total Income: $150,000`,
        documentType: 'tax_return',
      })

      expect(result.success).toBe(true)
      expect(result.data?.taxId).toBe('12-3456789')
      expect(result.data?.taxYear).toBe('2023')
    })

    it('should handle OCR errors gracefully', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          error: 'Unable to extract structured data',
          rawText: 'Illegible document...',
          confidence: 'low',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: '...garbled...text...',
        documentType: 'unknown',
      })

      expect(result.success).toBe(true) // Still succeeds but with low confidence
      expect(result.data?.confidence).toBe('low')
    })

    it('should handle AI service errors', async () => {
      vi.mocked(generateText).mockRejectedValueOnce(new Error('AI service timeout'))

      const result = await extractClientDataFromDocument({
        documentText: 'Some text',
        documentType: 'id',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to extract')
    })

    it('should validate extracted data', async () => {
      // Mock AI returns invalid email
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          fullName: 'Jane Doe',
          email: 'not-an-email', // Invalid!
          phone: '555-0100',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: 'Jane Doe, email: not-an-email, phone: 555-0100',
        documentType: 'contact_form',
      })

      expect(result.success).toBe(true)
      expect(result.data?.validationWarnings).toBeDefined()
      expect(result.data?.validationWarnings).toContain('email')
    })

    it('should extract with confidence scores', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          businessName: 'XYZ Inc',
          confidence: 'high',
          extractedFields: {
            businessName: { value: 'XYZ Inc', confidence: 0.95 },
            address: { value: '789 Elm St', confidence: 0.80 },
            phone: { value: '555-0200', confidence: 0.60 },
          },
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: 'XYZ Inc, 789 Elm St, 555-0200',
        documentType: 'business_card',
        includeConfidenceScores: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.extractedFields).toBeDefined()
      expect(result.data?.extractedFields?.businessName.confidence).toBeGreaterThan(
        0.9
      )
    })

    it('should handle multi-page documents', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          contractInfo: {
            parties: ['Company A', 'Company B'],
            effectiveDate: '2024-01-01',
            termMonths: 12,
            pageCount: 5,
          },
          type: 'contract',
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: `CONTRACT AGREEMENT
Effective Date: January 1, 2024
Party 1: Company A
Party 2: Company B
Term: 12 months
[...pages 1-5...]`,
        documentType: 'contract',
      })

      expect(result.success).toBe(true)
      expect(result.data?.contractInfo?.parties).toHaveLength(2)
    })

    it('should redact sensitive information', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          name: 'John Doe',
          ssn: '[REDACTED]', // AI should redact
          taxId: '[REDACTED]',
          accountNumber: '[REDACTED]',
          extractedData: {
            /* safe fields only */
          },
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: 'John Doe, SSN: 123-45-6789, Account: 9876543210',
        documentType: 'financial_statement',
        redactSensitive: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.ssn).toBe('[REDACTED]')
    })
  })

  describe('auto-fill from extraction', () => {
    it('should map extracted data to client fields', async () => {
      vi.mocked(generateText).mockResolvedValueOnce({
        text: JSON.stringify({
          fullName: 'Alice Johnson',
          email: 'alice@example.com',
          phone: '555-0300',
          address: {
            street: '321 Pine Rd',
            city: 'Seattle',
            state: 'WA',
            zip: '98101',
          },
        }),
      } as any)

      const result = await extractClientDataFromDocument({
        documentText: 'Driver License: Alice Johnson, alice@example.com...',
        documentType: 'id',
        mapToClientSchema: true,
      })

      expect(result.success).toBe(true)
      expect(result.data?.clientData).toBeDefined()
      expect(result.data?.clientData?.name).toBe('Alice Johnson')
      expect(result.data?.clientData?.email).toBe('alice@example.com')
      expect(result.data?.clientData?.type).toBe('individual')
    })
  })
})
