import express from "express"
import http from "http"
import { Server, Socket } from "socket.io"
import { createWorker } from "mediasoup"
import { Worker, Router, WebRtcTransport, Producer, Consumer, RtpCodecCapability } from "mediasoup/node/lib/types"

const app = express()
const server = http.createServer()

const io = new Server(server, {
    cors : {
        origin: '*',
        methods: ["GET", "POST"]
    }
})

type UserType = "streamer" | "watcher"

interface User {
    id: string,
    type: UserType
}

interface RoomState {
    streamers: User[],
    watchers: User[]
}

const Room_Name = "main-room"

const roomState: RoomState = {
    streamers: [],
    watchers: []
}

let worker: Worker
let router: Router
const transports = new Map<string, WebRtcTransport>()
const producers = new Map<string, Producer>()
const consumers = new Map<string, Consumer[]>()

const mediaCodecs: RtpCodecCapability[] = [
  {
    kind: "audio",
    mimeType: "audio/opus",
    clockRate: 48000,
    channels: 2,
    preferredPayloadType: 100
  },
  {
    kind: "video",
    mimeType: "video/VP8",
    clockRate: 90000,
    parameters: {},
    preferredPayloadType: 101
  }
]

async function initMediasoup(){
    worker = await createWorker()
    router = await worker.createRouter({ mediaCodecs })
    console.log("[mediasoup] Worker and Router created")
}

initMediasoup()

function broadcastRoomState() {
    io.in(Room_Name).emit("room-state-changed", {
        streamers: roomState.streamers.map((s) => s.id),
        watchers: roomState.watchers.map((w) => w.id)
    })
} 

function emitStreamAvailability() {
    if(roomState.streamers.length > 0){
        io.in(Room_Name).emit("stream-available"),
        console.log("[stream-available]")
    }
    else{
        io.in(Room_Name).emit("stream-unavailable"),
        console.log("[stream-unavailable]")
    }
}

function removeUser(id: String): User | null {
    let removedUser: User | null = null

    roomState.streamers = roomState.streamers.filter((s) => {
        if(s.id === id){
            removedUser = s;
            return false
        }

        return true
    })

    if(!removedUser){
        roomState.watchers = roomState.watchers.filter((w) => {
            if(w.id === id){
                removedUser = w;
                return false
            }

            return true
        })
    }

    return removedUser
}

async function createWebRtcTransport(): Promise<WebRtcTransport>{
    const transport = await router.createWebRtcTransport({
        listenIps: [{ ip: "0.0.0.0",}],
        enableUdp: true,
        enableTcp: true,
        preferUdp: true
    })
    
    return transport
}

io.on("connection", (socket: Socket) => {
    console.log(`[connection] Socket connect: ${socket.id}`)

    socket.on(
        "join-room",
        (userType: UserType, callback: (response : {success : boolean; error?: string}) => void) => {
            console.log(`[join-room] ${socket.id} wants to join as ${userType}`)

            socket.join(Room_Name)

            if(userType === "streamer"){
                if(roomState.streamers.length >= 2){
                    const errorMsg = "Streamer limit reached (max 2)"
                    console.warn(`[join-room] ${socket.id} rejected: ${errorMsg}`)
                    callback({success: false, error: errorMsg})
                    return
                }

                roomState.streamers.push({ id: socket.id, type: "streamer"})
                console.log(`[join-room] Streamer added: ${socket.id}`)
                callback({success: true})
            }
            else{
                roomState.watchers.push({ id: socket.id, type: "watcher"})
                console.log(`[join-room] Watcher added: ${socket.id}`)
                callback({success: true})
            }

            broadcastRoomState()
            emitStreamAvailability()
        }
    )

    socket.on(
        "leave-room", 
        () => {
            console.log(`[leave-room] ${socket.id} leaving room`)
            const removedUser = removeUser(socket.id)
            socket.leave(Room_Name)

            if(removedUser){
                broadcastRoomState()
                emitStreamAvailability()
                console.log(`[leave-room] User removal: ${socket.id}`)
            }
        }   
    )

    socket.on("get-room-state", (callback: (state: { streamers: string[]; watchers: string[] }) => void) => {
        callback({
            streamers: roomState.streamers.map((s) => s.id),
            watchers: roomState.watchers.map((w) => w.id)
        })
    })

    socket.on("disconnect", () => {
        console.log(`[disconnect] Socket disconnected ${socket.id}`)
        const removedUser = removeUser(socket.id)

        if(removedUser){
            broadcastRoomState()
            emitStreamAvailability()
            console.log(`[disconnect] User removed: ${socket.id}`)
        }
    })
})

const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
    console.log(`Socket.io signaling server listening on port ${PORT}`)
})
