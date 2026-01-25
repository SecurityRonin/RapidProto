import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export interface EmailOptions {
  to: string
  subject: string
  body: string
  from?: string
}

/**
 * Send email using Resend
 */
export async function sendEmail(options: EmailOptions) {
  const from = options.from || 'noreply@yourfirm.com'

  const { data, error } = await resend.emails.send({
    from,
    to: options.to,
    subject: options.subject,
    text: options.body,
  })

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`)
  }

  return data
}
