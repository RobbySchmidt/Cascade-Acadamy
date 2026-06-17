import { createHmac } from 'node:crypto'
function sign(value: string, secret: string) {
  return createHmac('sha256', secret).update(value).digest('base64url')
}
export function signSession(userId: string, secret: string) {
  return `${userId}.${sign(userId, secret)}`
}
export function verifySession(token: string | undefined, secret: string): string | null {
  if (!token) return null
  const i = token.lastIndexOf('.')
  if (i < 0) return null
  const userId = token.slice(0, i), sig = token.slice(i + 1)
  const expected = sign(userId, secret)
  if (sig.length !== expected.length) return null
  return sig === expected ? userId : null
}
