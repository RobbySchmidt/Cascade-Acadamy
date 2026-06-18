// Pure decision: should an incoming chat message raise a DM notification
// (badge + toast) for the current user? No DOM / no network — unit-tested.

import { conversationKeyFor, type RoutableMessage } from './chatRouting'

/**
 * True only for a direct message addressed to me, sent by someone else, whose
 * conversation I am not currently viewing. General-chat messages never notify.
 */
export function shouldNotifyDm(msg: RoutableMessage, myId: string, activeKey: string): boolean {
  if (!msg.recipientId) return false        // general chat
  if (msg.userId === myId) return false     // my own outgoing message
  return conversationKeyFor(msg, myId) !== activeKey
}
