// Thread helpers for thread-replies.mjs and plusplus.mjs. hobo replies in a
// message's own thread, or starts one under a top-level message; 1:1 DMs
// (room IDs starting with D) aren't threaded.

export function replyThread (message) {
  if (message.thread_ts != null) return message.thread_ts
  if (message.room?.startsWith('D')) return undefined
  return message.id
}

export function withThread (envelope, thread) {
  if (thread == null) return envelope
  return { ...envelope, message: { ...envelope.message, thread_ts: thread } }
}
