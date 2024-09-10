import { createServer } from 'http'
import { Server } from 'socket.io'
const PORT = 3001

const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
})

io.on('connection', (socket) => {
  const { partner, id, source } = socket.handshake.query
  const roomName = `event:${partner}-${id}`

  socket.join(roomName)
  socket.emit('join-room', `${source} joined`)

  socket.on('from-sdk', (data) => {
    console.log("🩲 🩲 => socket.on => data:", data)
    socket.to(roomName).emit('event-sdk', data)
  })

  socket.on('from-wallet', (data) => {
    console.log(data)
    socket.to(roomName).emit('event-wallet', data)
  })

  socket.on('delete-room', (data) => {
    io
      .in(roomName)
      .fetchSockets()
      .then(sockets => {
        sockets.forEach(socket => {
          socket.leave(roomName)
        })
      })
  })
})

const httpConnection = httpServer.listen(PORT)
httpConnection.on('connect', () => {
  console.log(`Connected on port ${PORT}`)
})