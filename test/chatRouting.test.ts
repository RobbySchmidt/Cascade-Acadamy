import { describe, it, expect } from 'vitest'
import { conversationKeyFor, partnerOf, type RoutableMessage } from '../app/utils/chatRouting'

const me = '10'
const other = '11'

function general(): RoutableMessage {
  return { userId: other, name: 'Tom B.', initials: 'TB', recipientId: null, recipientName: null, recipientInitials: null }
}
function dmFromMe(): RoutableMessage {
  return { userId: me, name: 'Mara K.', initials: 'MK', recipientId: other, recipientName: 'Tom B.', recipientInitials: 'TB' }
}
function dmToMe(): RoutableMessage {
  return { userId: other, name: 'Tom B.', initials: 'TB', recipientId: me, recipientName: 'Mara K.', recipientInitials: 'MK' }
}

describe('conversationKeyFor', () => {
  it('routes general messages to "general"', () => {
    expect(conversationKeyFor(general(), me)).toBe('general')
  })
  it('routes a DM I sent to the recipient', () => {
    expect(conversationKeyFor(dmFromMe(), me)).toBe(other)
  })
  it('routes a DM I received to the sender', () => {
    expect(conversationKeyFor(dmToMe(), me)).toBe(other)
  })
})

describe('partnerOf', () => {
  it('is null for general messages', () => {
    expect(partnerOf(general(), me)).toBeNull()
  })
  it('returns the recipient when I am the sender', () => {
    expect(partnerOf(dmFromMe(), me)).toEqual({ id: other, name: 'Tom B.', initials: 'TB' })
  })
  it('returns the sender when I am the recipient', () => {
    expect(partnerOf(dmToMe(), me)).toEqual({ id: other, name: 'Tom B.', initials: 'TB' })
  })
})
