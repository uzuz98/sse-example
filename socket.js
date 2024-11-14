const { createServer } = require('http')
const { Server } = require('socket.io')
const express = require('express')
const cors = require('cors')

const eventName = {
  connectWallet: 'connect-wallet',
  signAuth: 'sign-auth',
  integration: 'integration',
  loginTelegram: 'login-telegram'
}

const getReqEvent = (name) => {
  return `request-${name}`
}

const getResponseEvent = (name) => {
  return `response-${name}`
}

const app = express()
app.use(cors())

app.route('/health').get((req, res) => {
  res.status(200).send('ok')
})

const PORT = 3001

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ["PUT", "GET", "POST", "DELETE", "OPTIONS"],
    credentials: false
  }
})

const EVENT_CONNECT = [
  getReqEvent(eventName.connectWallet),
  getReqEvent(eventName.signAuth),
  getReqEvent(eventName.loginTelegram),
  'authentication'
]

io.on('connection', async (socket) => {
  const { partner, id, source, platform } = socket.handshake.query

  socket.on('error', (error) => {
    console.log('error', error)
  })

  socket.use(([event], next) => {
    if (
      !EVENT_CONNECT.includes(event) &&
      !socket.authorized &&
      !event.includes('response') &&
      event !== 'accounts-changed'
    ) {
      next(new Error('not authorized'))
      return
    }
    next()
  })

  const roomName = `event:${partner}-${id}-${platform}`
  await socket.join(roomName)

  const handleQOSL1 = (eventName) => (data) => {
    const eventListenName = `on-${eventName}`

    const emitEvent = () => {
      socket.timeout(2000).to(roomName).emit(
        eventListenName,
        data,
        (error) => {
          if (error) {
            console.log("🩲 🩲 => emitEvent => error:", error)
            emitEvent()
          }
        }
      )
    }
    emitEvent()
  }

  const handleSocketMessage = (name) => {
    socket.on(getResponseEvent(name), handleQOSL1(getResponseEvent(name)))
    socket.on(getReqEvent(name), handleQOSL1(getReqEvent(name)))
  }

  handleSocketMessage(eventName.integration)
  handleSocketMessage(eventName.connectWallet)
  handleSocketMessage(eventName.signAuth)
  handleSocketMessage(eventName.loginTelegram)

  socket.on('authentication', (data) => {
    try {
      const isVerifed = true // jwt.verify(data.token, process.env.VERIFY_SECRET_KEY_ADAPTER_TOKEN)
      console.log("🩲 🩲 => socket.on => isVerifed:", isVerifed)

      if (isVerifed) {
        socket.authorized = true
      } else {
        throw 'not authorized'
      }

    } catch (error) {
      socket.disconnect()
    }
  })

  socket.on('disconnect', () => {
    console.log('disconnected')
    socket.leave(roomName)
  })
  console.log("🩲 🩲 => socket.on => roomName:", roomName)

  if (source) {
    const emitJoinRoom = () => {
      socket
        .timeout(2000)
        .to(roomName)
        .emit(
          'join-room',
          `${source} joined`,
          (error) => {
            if (error) {
              console.log("🩲 🩲 => emitJoinRoom => error:", error)
              emitJoinRoom()
            }
          }
        )
    }
    emitJoinRoom()
  }
})

httpServer.listen(PORT).on('listening', () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})