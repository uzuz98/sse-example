import { createServer } from 'http'
import { Server } from 'socket.io'
import express from 'express'
import cors from 'cors'
import { recoverPersonalSignature } from 'eth-sig-util'

export const decodeAddressFromSig = (sig, msg) => {
  try {
    const address = recoverPersonalSignature({
      data: `0x${Buffer.from(msg, 'utf8').toString('hex')}`,
      sig
    })
    console.log("🩲 🩲 => decodeAddressFromSig => address:", address)
    return address
  } catch (err) {
    return ''
  }
}

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
  const { partner, id, source } = socket.handshake.query
  const roomName = `event:${partner}-${id}`

  socket.use(([event, ...args], next) => {
    // socket.request.
    console.log("🩲 🩲 => socket.use => event:", event)
    console.log('authorized:', socket.authorized)
    if (!EVENT_CONNECT.includes(event) && !socket.authorized && !event.includes('response')) {
      next(new Error('not authorized'))
      return
    }
    next()
  })

  await socket.join(roomName)
  socket.to(roomName).emit('join-room', `${source} joined`)

  const handleQOSL1 = (eventName) => (data, callback) => {
    const eventListenName = `on-${eventName}`

    console.log("🩲 🩲 => handleQOSL1 => eventListenName:", eventListenName)
    let timer
    if (callback && typeof callback === 'function') {
      // socket.to(roomName).emit(eventName, data)
      timer = setInterval(() => {
        socket.to(roomName).emit(
          eventListenName,
          data,
          () => {
            callback({
              status: 'ok',
              code: 200
            })
            clearInterval(timer)
          }
        )
      }, 1000)
    } else {
      socket.to(roomName).emit(eventListenName, data)
    }
  }

  const handleSocketMessage = (name) => {
    socket.on(getResponseEvent(name), handleQOSL1(getResponseEvent(name)))
    socket.on(getReqEvent(name), handleQOSL1(getReqEvent(name)))
  }

  handleSocketMessage(eventName.integration)
  handleSocketMessage(eventName.connectWallet)
  handleSocketMessage(eventName.signAuth)
  handleSocketMessage(eventName.loginTelegram)

  socket.on('authentication', (data, cb) => {
    try {
      const { signature, address } = data
      console.log("🩲 🩲 => socket.on => signature:", signature)
      if (!signature || !address) {
        throw 'not authorized'
      }
      const addressDecoded = decodeAddressFromSig(signature, "Sign message for authenticate to connect bot coin98")
      if (addressDecoded === address) {
        socket.authorized = true
        cb(true)
      } else {
        throw 'not authorized'
      }

    } catch (error) {
      cb(false)
      socket.disconnect()
    }
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