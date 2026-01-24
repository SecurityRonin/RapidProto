import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { z } from 'zod'

/**
 * AI-powered document data extraction
 * Uses Vercel AI Gateway (no BYOK needed!)
 */

export interface DocumentExtractionOptions {
  documentText: string
  documentType:
    | 'id'
    | 'business_license'
    | 'tax_return'
    | 'contract'
    | 'financial_statement'
    | 'contact_form'
    | 'business_card'
    | 'unknown'
  includeConfidenceScores?: boolean
  redactSensitive?: boolean
  mapToClientSchema?: boolean
}

export interface ExtractedData {
  [key: string]: any
  confidence?: 'low' | 'medium' | 'high'
  validationWarnings?: string[]
  extractedFields?: Record<
    string,
    {
      value: any
      confidence: number
    }
  >
  clientData?: {
    name: string
    email?: string
    phone?: string
    type: 'individual' | 'business'
    address?: any
  }
}

/**
 * Extract structured data from document text
 */
export async function extractClientDataFromDocument(
  options: DocumentExtractionOptions
): Promise<{ success: true; data: ExtractedData } | { success: false; error: string }> {
  try {
    const prompt = buildExtractionPrompt(options)

    const result = await generateText({
      model: openai('gpt-4o'),
      prompt,
      temperature: 0.1, // Low temperature for consistent extraction
    })

    let extractedData: ExtractedData

    try {
      extractedData = JSON.parse(result.text)
    } catch {
      return {
        success: false,
        error: 'Failed to parse AI response',
      }
    }

    // Validate extracted data
    if (!options.redactSensitive) {
      const warnings = validateExtractedData(extractedData)
      if (warnings.length > 0) {
        extractedData.validationWarnings = warnings
      }
    }

    // Map to client schema if requested
    if (options.mapToClientSchema) {
      extractedData.clientData = mapToClientSchema(extractedData)
    }

    return {
      success: true,
      data: extractedData,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to extract data',
    }
  }
}

/**
 * Build extraction prompt based on document type
 */
function buildExtractionPrompt(options: DocumentExtractionOptions): string {
  const basePrompt = `Extract structured information from this document.

Document Type: ${options.documentType}
Document Text:
${options.documentText}

`

  const typeSpecificInstructions: Record<string, string> = {
    id: `Extract: fullName, dateOfBirth, address (object with street, city, state, zip), idNumber, expiryDate`,
    business_license: `Extract: businessName, licenseNumber, address, expiryDate, issueDate, licenseType`,
    tax_return: `Extract: name (individual or business), taxId, taxYear, filingStatus, income, deductions`,
    contract: `Extract: parties (array), effectiveDate, expiryDate, termMonths, keyTerms (array), pageCount`,
    financial_statement: `Extract: entityName, statementDate, totalAssets, totalLiabilities, netWorth${
      options.redactSensitive
        ? '. REDACT: SSN, account numbers, credit card numbers'
        : ''
    }`,
    contact_form: `Extract: fullName, email, phone, company, message, preferredContact`,
    business_card: `Extract: fullName, title, company, email, phone, website, address`,
    unknown: `Extract any structured information you can find`,
  }

  const instructions = typeSpecificInstructions[options.documentType]

  let prompt = basePrompt + instructions

  if (options.includeConfidenceScores) {
    prompt += `

For each extracted field, include a confidence score (0-1) in this format:
{
  "extractedFields": {
    "fieldName": { "value": "...", "confidence": 0.95 }
  },
  "confidence": "high|medium|low"
}`
  }

  if (options.redactSensitive) {
    prompt += `

IMPORTANT: Replace any sensitive information (SSN, account numbers, credit cards) with "[REDACTED]"`
  }

  prompt += `

Return ONLY valid JSON. No markdown, no explanations.`

  return prompt
}

/**
 * Validate extracted data for common issues
 */
function validateExtractedData(data: ExtractedData): string[] {
  const warnings: string[] = []

  // Validate email if present
  if (data.email && !z.string().email().safeParse(data.email).success) {
    warnings.push('email format appears invalid')
  }

  // Validate phone if present
  if (
    data.phone &&
    !/^\+?1?\d{10,14}$/.test(data.phone.replace(/[\s()-]/g, ''))
  ) {
    warnings.push('phone format appears invalid')
  }

  // Check for common OCR mistakes
  if (data.fullName && /[0-9]/.test(data.fullName)) {
    warnings.push('name contains numbers (possible OCR error)')
  }

  // Check date formats
  if (data.dateOfBirth && isNaN(Date.parse(data.dateOfBirth))) {
    warnings.push('date of birth format appears invalid')
  }

  return warnings
}

/**
 * Map extracted data to client schema
 */
function mapToClientSchema(extracted: ExtractedData): {
  name: string
  email?: string
  phone?: string
  type: 'individual' | 'business'
  address?: any
} {
  // Determine if individual or business
  const isIndividual =
    extracted.fullName ||
    extracted.dateOfBirth ||
    extracted.idNumber ||
    extracted.type === 'individual'

  return {
    name: extracted.fullName || extracted.businessName || extracted.name || 'Unknown',
    email: extracted.email,
    phone: extracted.phone,
    type: isIndividual ? 'individual' : 'business',
    address: extracted.address,
  }
}
