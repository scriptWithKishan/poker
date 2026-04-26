import http from 'node:http'
import {
  hashPassword,
  normalizeUsername,
  requireUser,
  signToken,
  validateCredentials,
  verifyPassword,
} from './auth.js'
import { loadEnv } from './env.js'
import { broadcastRoom, addRoomClient, sendRoom } from './realtime.js'
import { createStorage } from './storage.js'

loadEnv()

const PORT = Number(process.env.PORT || 4000)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'
const storage = await createStorage()

function setCors(response) {
  response.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN)
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS')
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

function sendJson(response, statusCode, body) {
  setCors(response)
  response.writeHead(statusCode, { 'Content-Type': 'application/json' })
  response.end(JSON.stringify(body))
}

async function readJson(request) {
  const chunks = []

  for await (const chunk of request) {
    chunks.push(chunk)
  }

  const body = Buffer.concat(chunks).toString('utf8')
  return body ? JSON.parse(body) : {}
}

function getRoomIdFromPath(pathname, suffix = '') {
  const match = pathname.match(new RegExp(`^/api/rooms/([^/]+)${suffix}$`))
  return match?.[1]?.toUpperCase() || null
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
  }
}

async function handleSignup(request, response) {
  const body = await readJson(request)
  const username = normalizeUsername(body.username)
  const validationError = validateCredentials(username, body.password)

  if (validationError) {
    sendJson(response, 400, { message: validationError })
    return
  }

  const existingUser = await storage.getUserByUsername(username)
  if (existingUser) {
    sendJson(response, 409, { message: 'Username is already taken' })
    return
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    passwordHash: await hashPassword(body.password),
  }
  await storage.createUser(user)

  sendJson(response, 201, { user: publicUser(user), token: signToken(user) })
}

async function handleLogin(request, response) {
  const body = await readJson(request)
  const username = normalizeUsername(body.username)
  const user = await storage.getUserByUsername(username)

  if (!user || !(await verifyPassword(body.password || '', user.passwordHash))) {
    sendJson(response, 401, { message: 'Invalid username or password' })
    return
  }

  sendJson(response, 200, { user: publicUser(user), token: signToken(user) })
}

/*
  Small API surface:
  - GET /health checks server and storage mode
  - POST /api/auth/signup creates a user with a bcrypt password hash
  - POST /api/auth/login returns a JWT for a username/password pair
  - GET /api/auth/me verifies the current JWT
  - GET /api/rooms/:roomId loads one room
  - PUT /api/rooms/:roomId saves one full room state and broadcasts it
  - GET /api/rooms/:roomId/events streams updates to connected clients
*/
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, `http://${request.headers.host}`)

    if (request.method === 'OPTIONS') {
      setCors(response)
      response.writeHead(204)
      response.end()
      return
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      sendJson(response, 200, { ok: true, storage: storage.mode })
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/signup') {
      await handleSignup(request, response)
      return
    }

    if (request.method === 'POST' && url.pathname === '/api/auth/login') {
      await handleLogin(request, response)
      return
    }

    if (request.method === 'GET' && url.pathname === '/api/auth/me') {
      const auth = await requireUser(request, storage)
      if (auth.error) {
        sendJson(response, auth.error.statusCode, { message: auth.error.message })
        return
      }

      sendJson(response, 200, { user: publicUser(auth.user) })
      return
    }

    const eventsRoomId = getRoomIdFromPath(url.pathname, '/events')
    if (request.method === 'GET' && eventsRoomId) {
      const auth = await requireUser(request, storage, url.searchParams.get('token'))
      if (auth.error) {
        sendJson(response, auth.error.statusCode, { message: auth.error.message })
        return
      }

      setCors(response)
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      })

      addRoomClient(eventsRoomId, response)
      const room = await storage.getRoom(eventsRoomId)
      if (room) sendRoom(response, room)
      return
    }

    const roomId = getRoomIdFromPath(url.pathname)
    if (request.method === 'GET' && roomId) {
      const auth = await requireUser(request, storage)
      if (auth.error) {
        sendJson(response, auth.error.statusCode, { message: auth.error.message })
        return
      }

      const room = await storage.getRoom(roomId)
      sendJson(response, room ? 200 : 404, room ? { room } : { message: 'Room not found' })
      return
    }

    if (request.method === 'PUT' && roomId) {
      const auth = await requireUser(request, storage)
      if (auth.error) {
        sendJson(response, auth.error.statusCode, { message: auth.error.message })
        return
      }

      const body = await readJson(request)
      const room = { ...body.room, roomId }

      await storage.saveRoom(room)
      broadcastRoom(room)
      sendJson(response, 200, { room })
      return
    }

    sendJson(response, 404, { message: 'Route not found' })
  } catch (error) {
    sendJson(response, 500, { message: error.message || 'Server error' })
  }
})

server.listen(PORT, () => {
  console.log(`Poker backend running on http://localhost:${PORT}`)
  console.log(`Storage mode: ${storage.mode}`)
})
