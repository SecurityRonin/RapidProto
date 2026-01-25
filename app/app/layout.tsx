import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'RapidProto',
  description: 'From discovery to demo in 50 minutes',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
