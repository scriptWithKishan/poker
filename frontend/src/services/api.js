import { createRoom } from '../utils/game'

const API_URL = import.meta.env.VITE_API_URL?.replace(/\/$/, '')
const TOKEN_KEY = 'poker-auth-token'
const USER_KEY = 'poker-auth-user'

function requireApiUrl() {
  if (!API_URL) {
    throw new Error('VITE_API_URL is missing. Add it to frontend/.env.')
  }
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function authHeaders() {
  const token = getToken()

  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseJsonResponse(response, fallbackMessage) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.message || fallbackMessage)
  }

  return data
}

/*
  API helpers keep network details out of React components.
  Hosting only needs VITE_API_URL to change, so component code does not need
  cloud-specific URLs or environment checks.
*/
export async function fetchRoom(roomId) {
  requireApiUrl()
  const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
    headers: authHeaders(),
  })

  if (response.status === 404) return null
  const data = await parseJsonResponse(response, 'Could not load room')
  return data.room
}

export async function saveRoomToApi(room) {
  requireApiUrl()
  const response = await fetch(`${API_URL}/api/rooms/${room.roomId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ room }),
  })

  const data = await parseJsonResponse(response, 'Could not save room')
  return data.room
}

export async function loadOrCreateRoom(roomId) {
  const savedRoom = await fetchRoom(roomId)

  if (savedRoom) return savedRoom

  const room = createRoom(roomId)
  await saveRoomToApi(room)
  return room
}

export function subscribeToRoom(roomId, onRoom) {
  requireApiUrl()
  const token = encodeURIComponent(getToken())
  const events = new EventSource(`${API_URL}/api/rooms/${roomId}/events?token=${token}`)

  events.addEventListener('room', (event) => {
    onRoom(JSON.parse(event.data))
  })

  return () => events.close()
}

export function getSavedSession() {
  const token = getToken()
  const savedUser = localStorage.getItem(USER_KEY)

  if (!token || !savedUser) return null

  try {
    return {
      token,
      user: JSON.parse(savedUser),
    }
  } catch {
    clearSession()
    return null
  }
}

export function saveSession(session) {
  localStorage.setItem(TOKEN_KEY, session.token)
  localStorage.setItem(USER_KEY, JSON.stringify(session.user))
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export async function signup(username, password) {
  requireApiUrl()
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const session = await parseJsonResponse(response, 'Could not sign up')
  saveSession(session)
  return session
}

export async function login(username, password) {
  requireApiUrl()
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const session = await parseJsonResponse(response, 'Could not log in')
  saveSession(session)
  return session
}

export async function getCurrentUser() {
  requireApiUrl()
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: authHeaders(),
  })
  const data = await parseJsonResponse(response, 'Could not verify login')
  return data.user
}
