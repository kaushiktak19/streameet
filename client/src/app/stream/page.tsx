"use client"

import { useSocket } from "@/hooks/useSocket"
import { useEffect, useState } from "react"

export default function StreamPage() {
  const { connected, roomState, error } = useSocket("streamer")
  const isFull = roomState.streamers.length >= 2

  const [isStreaming, setIsStreaming] = useState(false)

  useEffect(() => {
    if (!isStreaming && roomState.streamers.length > 0) {
      setIsStreaming(true)
    }
  }, [roomState.streamers, isStreaming])

  const showLimitReached = isFull && !isStreaming

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-8 border border-slate-200">
        <header className="mb-6 border-b border-slate-100 pb-4">
          <h1 className="text-2xl font-semibold text-slate-800">Streamer Console</h1>
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
            <h2 className="text-sm font-semibold text-slate-700 mb-2">Room State</h2>
            <div className="text-sm text-slate-600 space-y-1">
              <p>Streamers: {roomState.streamers.length} / 2</p>
              <p>Watchers: {roomState.watchers.length}</p>
            </div>
          </div>

          {showLimitReached ? (
            <div className="text-sm font-medium text-center px-4 py-3 rounded-md bg-red-50 border border-red-200 text-red-700">
              Maximum number of streamers reached
            </div>
          ) : (
            <div className="text-sm font-medium text-center px-4 py-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
              You are currently a streamer
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
