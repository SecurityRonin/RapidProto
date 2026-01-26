import Link from 'next/link'
import { ArrowRight, Clock, Layers, Presentation } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-gradient-to-b from-white via-gray-50 to-white relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(0,0,0,0.02)_1px,_transparent_1px)] bg-[length:24px_24px]" />

      <div className="relative z-10 text-center space-y-8 max-w-2xl">
        {/* Logo mark */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-white text-2xl font-bold">R</span>
          </div>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-gray-900">
          RapidProto
        </h1>

        <p className="text-xl md:text-2xl text-gray-500 tracking-wide max-w-lg mx-auto leading-relaxed">
          From discovery to demo in 50 minutes
        </p>

        {/* Phase timeline */}
        <div className="flex items-center justify-center gap-3 md:gap-6 py-6">
          <PhaseCard icon={<Layers className="w-5 h-5" />} label="Discovery" time="10 min" />
          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <PhaseCard icon={<Clock className="w-5 h-5" />} label="Build" time="30 min" highlight />
          <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
          <PhaseCard icon={<Presentation className="w-5 h-5" />} label="Demo" time="10 min" />
        </div>

        <div className="pt-4">
          <Link
            href="/session/new"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 text-base font-medium text-white bg-black rounded-full hover:bg-gray-800 hover:scale-[1.02] hover:shadow-xl transition-all duration-200"
          >
            Start Session
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Stats */}
        <div className="pt-8 flex items-center justify-center gap-8 text-sm text-gray-400">
          <span>3 phases</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>50 minutes</span>
          <span className="w-1 h-1 rounded-full bg-gray-300" />
          <span>1 prototype</span>
        </div>
      </div>
    </main>
  )
}

function PhaseCard({
  icon,
  label,
  time,
  highlight = false
}: {
  icon: React.ReactNode
  label: string
  time: string
  highlight?: boolean
}) {
  return (
    <div className={`
      flex flex-col items-center gap-2 p-4 rounded-xl transition-all
      ${highlight
        ? 'bg-black text-white shadow-lg scale-105'
        : 'bg-white text-gray-600 border border-gray-100 shadow-sm'
      }
    `}>
      {icon}
      <span className="font-medium text-sm">{label}</span>
      <span className={`text-xs ${highlight ? 'text-gray-300' : 'text-gray-400'}`}>{time}</span>
    </div>
  )
}
