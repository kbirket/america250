import { SignJWT, jwtVerify } from 'jose'

const secret = new TextEncoder().encode(process.env.AUTH_SECRET || 'fallback-dev-secret-change-me')

export async function createSessionToken(email) {
  return await new SignJWT({ email })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret)
}

export async function verifySessionToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}

export function isValidPHCEmail(email) {
  return /^[^\s@]+@pattersonhc\.org$/i.test(email)
}

export async function getSessionFromCookies(req) {
  const token = req.cookies?.session
  if (!token) return null
  return await verifySessionToken(token)
}

export function setSessionCookie(res, token) {
  res.setHeader('Set-Cookie', [
    `session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${30 * 24 * 60 * 60}`,
  ])
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', ['session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0'])
}
