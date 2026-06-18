import { describe, it, expect } from 'vitest'
import { shouldNotifyDm } from '../app/utils/chatNotify'
import type { RoutableMessage } from '../app/utils/chatRouting'

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

describe('shouldNotifyDm', () => {
  it('notifies for a DM to me when another conversation is active', () => {
    expect(shouldNotifyDm(dmToMe(), me, 'general')).toBe(true)
  })
  it('does not notify when I am already viewing that conversation', () => {
    expect(shouldNotifyDm(dmToMe(), me, other)).toBe(false)
  })
  it('does not notify for my own outgoing DM', () => {
    expect(shouldNotifyDm(dmFromMe(), me, 'general')).toBe(false)
  })
  it('does not notify for general chat messages', () => {
    expect(shouldNotifyDm(general(), me, 'general')).toBe(false)
  })
})
