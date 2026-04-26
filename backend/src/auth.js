import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

const TOKEN_EXPIRES_IN = '7d'

function getJwtSecret() {
  const secret = process.env.JWT_SECRET

  if (!secret || secret.includes('CHANGE_ME')) {
    throw new Error('JWT_SECRET is missing. Add a strong value to backend/.env.')
  }

  return secret
}

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase()
}

export function validateCredentials(username, password) {
  const normalizedUsername = normalizeUsername(username)
  const safePassword = String(password || '')

  if (normalizedUsername.length < 3) {
    return 'Username must be at least 3 characters.'
  }

  if (!/^[a-z0-9_]+$/.test(normalizedUsername)) {
    return 'Username can only use letters, numbers, and underscores.'
  }

  if (safePassword.length < 6) {
    return 'Password must be at least 6 characters.'
  }

  return ''
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, username: user.username }, getJwtSecret(), { expiresIn: TOKEN_EXPIRES_IN })
}

export function getBearerToken(request) {
  const header = request.headers.authorization || ''
  const [scheme, token] = header.split(' ')

  return scheme === 'Bearer' ? token : ''
}

/*
  Middleware-style auth helper for the plain Node server.
  It verifies the JWT and returns the matching user from storage, letting each
  protected route fail early before touching room data.
*/
export async function requireUser(request, storage, tokenOverride = '') {
  const token = tokenOverride || getBearerToken(request)

  if (!token) {
    return { error: { statusCode: 401, message: 'Login required' } }
  }

  try {
    const payload = jwt.verify(token, getJwtSecret())
    const user = await storage.getUserById(payload.sub)

    if (!user) {
      return { error: { statusCode: 401, message: 'User no longer exists' } }
    }

    return { user }
  } catch {
    return { error: { statusCode: 401, message: 'Invalid or expired token' } }
  }
}
