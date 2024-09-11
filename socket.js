import { createServer } from 'http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'

const app = express()
app.use(cors())

const PORT = 3001

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: [
      'https://frabjous-eclair-2ffb0f.netlify.app/',
      '*'
    ],
  }
})

io.on('connection', async (socket) => {
  const { partner, id, source } = socket.handshake.query
  const roomName = `event:${partner}-${id}`

  console.log("🩲 🩲 => io.on => roomName:", roomName)
  await socket.join(roomName)
  socket.to(roomName).emit('join-room', `${source} joined`)

  socket.on('from-sdk', (data) => {
    console.log("🩲 🩲 => socket.on => data:", data)
    socket.to(roomName).emit('event-sdk', data)
  })

  socket.on('from-wallet', (data) => {
    console.log(data)
    socket.to(roomName).emit('event-wallet', data)
  })

  socket.on('sdk-login-telegram', (data) => {
    socket.to(roomName).emit('token-login-telegram', data)
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

  socket.on('disconnect', () => {
    socket.leave(roomName)
  })
})

httpServer.listen(PORT)