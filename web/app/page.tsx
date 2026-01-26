import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">RapidProto</h1>
      <p className="text-xl text-gray-600 mb-8">From discovery to demo in 50 minutes</p>
      <Link
        href="/session/new"
        className="px-8 py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
      >
        Start Session
      </Link>
    </main>
  )
}
