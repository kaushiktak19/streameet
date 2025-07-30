"use client"

import { useSocket } from "@/hooks/useSocket"

export default function WatchPage() {
  const { connected, roomState, error, streamAvailable } = useSocket("watcher")

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8 border border-slate-200">
        <header className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-semibold text-slate-800">Viewer Console</h1>
          <p className="text-sm text-slate-500 mt-1">
            {connected ? (
              <span className="text-blue-600 font-medium">Connected to server</span>
            ) : (
              "Connecting..."
            )}
          </p>
        </header>

        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <section className="grid gap-6">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Stream Status</h2>
            <p
              className={`text-sm font-medium ${
                streamAvailable ? "text-emerald-600" : "text-slate-400"
              }`}
            >
              {streamAvailable
                ? "Live stream is currently active"
                : "No live stream available"}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg">
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Room State</h2>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Streamers: {roomState.streamers.length} / 2</p>
              <p>Watchers: {roomState.watchers.length}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
