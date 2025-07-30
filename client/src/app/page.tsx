import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen bg-brand-light flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-slate-50 rounded-2xl shadow-md border border-slate-200 p-8 text-center">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-brand">Streameet</h1>
          <p className="text-sm text-slate-500 mt-2">
            Choose your role to get started.
          </p>
        </header>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link
            href="/stream"
            className="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition"
            >
            Join as Streamer
          </Link>
          <Link
            href="/watch"
            className="block w-full text-center bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-3 rounded-lg transition"
          >
            Watch Stream
          </Link>
        </div>
      </div>
    </main>
  )
}
