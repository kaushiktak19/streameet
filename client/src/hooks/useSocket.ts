import { useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

type UserType = "streamer" | "watcher"

interface RoomState {
  streamers: string[],
  watchers: string[]
}

const SOCKET_SERVER_URL = process.env.SOCKET_SERVER || "http://localhost:8080"

export function useSocket(userType: UserType) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [roomState, setRoomState] = useState<RoomState>({ streamers: [], watchers: [] })
  const [streamAvailable, setStreamAvailable] = useState(false)

  useEffect(() => {
    const newSocket = io(SOCKET_SERVER_URL)
    setSocket(newSocket)

    newSocket.on("connect", () => {
      console.log("[socket] connected", newSocket.id)
      setConnected(true)

      newSocket.emit("join-room", userType, (response: { success: boolean; error?: string }) => {
        if (!response.success) {
          setError(response.error || "Failed to join room")
        }
      })

      newSocket.emit("get-room-state", (state: RoomState) => {
        setRoomState(state)
      })
    })

    newSocket.on("disconnect", () => {
      console.log("[socket] disconnected")
      setConnected(false)
    })

    newSocket.on("room-state-changed", (state: RoomState) => {
      setRoomState(state)
    })

    newSocket.on("stream-available", () => setStreamAvailable(true))
    newSocket.on("stream-unavailable", () => setStreamAvailable(false))

    return () => {
      newSocket.emit("leave-room")
      newSocket.disconnect()
    }
  }, [userType])

  return { socket, connected, error, roomState, streamAvailable }
}
