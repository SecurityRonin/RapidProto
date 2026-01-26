import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-white">
      <div className="text-center space-y-6">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
          RapidProto
        </h1>
        <p className="text-lg md:text-xl text-gray-500 tracking-wide max-w-md mx-auto">
          From discovery to demo in 50 minutes
        </p>
        <div className="pt-4">
          <Link
            href="/session/new"
            className="inline-flex items-center justify-center px-8 py-4 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 hover:scale-[1.02] hover:shadow-lg transition-all duration-200"
          >
            Start Session
          </Link>
        </div>
      </div>
    </main>
  )
}
