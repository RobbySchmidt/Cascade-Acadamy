import { describe, it, expect } from 'vitest'
import { signSession, verifySession } from '../server/utils/session'
describe('session', () => {
  const secret = 'test-secret'
  it('round-trips a user id', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token, secret)).toBe('user-123')
  })
  it('rejects tampered token', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token + 'x', secret)).toBeNull()
  })
  it('rejects wrong secret', () => {
    const token = signSession('user-123', secret)
    expect(verifySession(token, 'other')).toBeNull()
  })
})
