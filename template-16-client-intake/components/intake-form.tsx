'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { upload } from '@vercel/blob'
import { submitIntakeForm } from '@/lib/actions/intake'
import { Button } from '@/components/ui/button'

/**
 * Client-facing intake form for professional services
 */

const intakeSchema = z.object({
  fullName: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().optional(),
  company: z.string().optional(),
  message: z.string().min(10, 'Please describe your needs (at least 10 characters)'),
})

type IntakeFormData = z.infer<typeof intakeSchema>

interface IntakeFormProps {
  formId: string
  searchParams?: URLSearchParams
}

export function IntakeForm({ formId, searchParams }: IntakeFormProps) {
  const [documents, setDocuments] = useState<{ name: string; url: string }[]>([])
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeFormData>({
    resolver: zodResolver(intakeSchema),
    defaultValues: {
      fullName: searchParams?.get('name') || '',
      email: searchParams?.get('email') || '',
    },
  })

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const file = files[0]
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })

      setDocuments((prev) => [
        ...prev,
        { name: file.name, url: blob.url },
      ])
    } catch (err) {
      setError('Failed to upload document')
    } finally {
      setUploading(false)
    }
  }

  const onSubmit = async (data: IntakeFormData) => {
    setError(null)

    const result = await submitIntakeForm({
      formId,
      submitterName: data.fullName,
      submitterEmail: data.email,
      data: {
        fullName: data.fullName,
        phone: data.phone,
        company: data.company,
        message: data.message,
        documents: documents.map((d) => d.url),
      },
    })

    if (result.success) {
      setSubmitted(true)
    } else {
      setError(result.error)
    }
  }

  if (submitted) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">Thank you for your submission!</h2>
        <p className="text-muted-foreground">
          We'll review your information and get back to you shortly.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div>
        <label htmlFor="fullName" className="block text-sm font-medium mb-2">
          Full Name *
        </label>
        <input
          id="fullName"
          {...register('fullName')}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.fullName && (
          <p className="text-sm text-red-600 mt-1">{errors.fullName.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium mb-2">
          Email *
        </label>
        <input
          id="email"
          type="email"
          {...register('email')}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium mb-2">
          Phone
        </label>
        <input
          id="phone"
          type="tel"
          {...register('phone')}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium mb-2">
          Company / Organization
        </label>
        <input
          id="company"
          {...register('company')}
          className="w-full px-3 py-2 border rounded-md"
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium mb-2">
          Describe your needs *
        </label>
        <textarea
          id="message"
          {...register('message')}
          rows={4}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.message && (
          <p className="text-sm text-red-600 mt-1">{errors.message.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="documents" className="block text-sm font-medium mb-2">
          Upload documents (optional)
        </label>
        <input
          id="documents"
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
          className="w-full px-3 py-2 border rounded-md"
          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
        />
        {documents.length > 0 && (
          <ul className="mt-2 space-y-1">
            {documents.map((doc, i) => (
              <li key={i} className="text-sm text-muted-foreground">
                {doc.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isSubmitting || uploading}
        className="w-full"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Intake Form'}
      </Button>
    </form>
  )
}
