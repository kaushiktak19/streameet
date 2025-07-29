import express from "express"
import http from "http"
import { Server, Socket } from "socket.io"

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

function broadcastRoomState() {
    io.in(Room_Name).emit("room-state-changed", {
        streamers: roomState.streamers.map((s) => s.id),
        watchers: roomState.watchers.map((w) => w.id)
    })
} 

function emitStreamAvailabilty() {
    if(roomState.streamers.length > 0){
        io.in(Room_Name).emit("stream-available"),
        console.log("[stream-available")
    }
    else{
        io.in(Room_Name).emit("stream-unavailable"),
        console.log("[stream-unavailable")
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
            emitStreamAvailabilty()
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
                emitStreamAvailabilty()
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
            emitStreamAvailabilty()
            console.log(`[disconnect] User removed: ${socket.id}`)
        }
    })
})

const PORT = process.env.PORT || 8080

server.listen(PORT, () => {
    console.log(`Socket.io signaling server listening on port ${PORT}`)
})
