// Score storage for plusplus.mjs, ported from hubot-plusplus 1.4.0 (ajacksified).
//
// The brain layout is hubot-plusplus's, plus a thread on each last entry and a
// lastByThread map, so hobo's existing karma keeps working:
//   robot.brain.data.plusPlus = {
//     scores:       { <name>: <number> },
//     reasons:      { <name>: { <reason>: <number> } },
//     log:          { <from>: { <name>: <ISO date of last vote> } },
//     last:         { <room>: { user: <name>, reason: <reason>, thread: <thread_ts> } },
//     lastByThread: { <room>: { <thread_ts>: { user: <name>, reason: <reason> } } }
//   }

const SPAM_WINDOW_MS = 5 * 1000
const THREADS_PER_ROOM = parseInt(process.env.HUBOT_PLUSPLUS_THREADS_PER_ROOM, 10) || 50
// Names that would hit Object.prototype instead of creating a score.
const RESERVED = new Set(['__proto__', 'constructor', 'prototype'])
const has = (obj, key) => Object.hasOwn(obj, key)

export default class ScoreKeeper {
  constructor (robot) {
    this.robot = robot
    // hubot-redis-brain emits 'connected' once the stored brain is merged in.
    // Until then plusPlus is an empty placeholder, and saving it would
    // overwrite the real brain in Redis.
    this.ready = false
    this.robot.brain.on('connected', () => { this.ready = true })
    const storageLoaded = () => {
      const data = this.robot.brain.data
      data.plusPlus ??= { scores: {}, log: {}, reasons: {}, last: {}, lastByThread: {} }
      this.storage = data.plusPlus
      for (const key of ['scores', 'log', 'reasons', 'last', 'lastByThread']) {
        if (typeof this.storage[key] !== 'object' || this.storage[key] === null) this.storage[key] = {}
      }
    }
    this.robot.brain.on('loaded', storageLoaded)
    storageLoaded() // in case the brain loaded before this script
  }

  getUser (user) {
    if (!has(this.storage.scores, user)) this.storage.scores[user] = 0
    if (!has(this.storage.reasons, user)) this.storage.reasons[user] = {}
    return user
  }

  isValidKey (key) {
    return !RESERVED.has(key)
  }

  saveUser (user, from, room, reason, thread) {
    this.saveScoreLog(user, from, room, reason, thread)
    this.robot.brain.save()
    const reasons = this.storage.reasons[user]
    return [this.storage.scores[user], (reason != null && has(reasons, reason) && reasons[reason]) || 'none']
  }

  add (user, from, room, reason, thread) {
    return this.#change(user, from, room, reason, thread, 1)
  }

  subtract (user, from, room, reason, thread) {
    return this.#change(user, from, room, reason, thread, -1)
  }

  #change (user, from, room, reason, thread, delta) {
    if (!this.validate(user, from)) return [null, null]
    user = this.getUser(user)
    this.storage.scores[user] += delta
    if (reason) {
      const reasons = this.storage.reasons[user]
      reasons[reason] = (has(reasons, reason) ? reasons[reason] : 0) + delta
    }
    return this.saveUser(user, from, room, reason, thread)
  }

  erase (user, from, room, reason) {
    user = this.getUser(user)
    if (reason) {
      delete this.storage.reasons[user][reason]
      this.saveUser(user, from, room)
    } else {
      delete this.storage.scores[user]
      delete this.storage.reasons[user]
      this.robot.brain.save()
    }
    return true
  }

  scoreForUser (user) {
    return this.storage.scores[this.getUser(user)]
  }

  reasonsForUser (user) {
    return this.storage.reasons[this.getUser(user)]
  }

  saveScoreLog (user, from, room, reason, thread) {
    if (!has(this.storage.log, from) || typeof this.storage.log[from] !== 'object' || this.storage.log[from] === null) {
      this.storage.log[from] = {}
    }
    this.storage.log[from][user] = new Date().toISOString()
    this.storage.last[room] = { user, reason, thread }
    if (thread != null) {
      if (!has(this.storage.lastByThread, room)) this.storage.lastByThread[room] = {}
      const threads = this.storage.lastByThread[room]
      // Re-inserting moves the thread to the end, so the oldest keys are the least recently voted.
      delete threads[thread]
      threads[thread] = { user, reason }
      for (const old of Object.keys(threads).slice(0, -THREADS_PER_ROOM)) delete threads[old]
    }
  }

  last (room) {
    const last = has(this.storage.last, room) ? this.storage.last[room] : null
    if (last == null) return [undefined, undefined, undefined]
    if (typeof last === 'string') return [last, '', undefined]
    return [last.user, last.reason, last.thread]
  }

  lastByThread (room, thread) {
    const threads = has(this.storage.lastByThread, room) ? this.storage.lastByThread[room] : {}
    const last = has(threads, thread) ? threads[thread] : null
    if (last == null) return [undefined, undefined]
    return [last.user, last.reason]
  }

  isSpam (user, from) {
    if (!has(this.storage.log, from)) this.storage.log[from] = {}
    const submitted = has(this.storage.log[from], user) && this.storage.log[from][user]
    if (!submitted) return false
    const isSpam = new Date(submitted).getTime() + SPAM_WINDOW_MS > Date.now()
    if (!isSpam) delete this.storage.log[from][user]
    return isSpam
  }

  validate (user, from) {
    return user != null && user !== '' && user !== from && this.isValidKey(user) && this.isValidKey(from) && !this.isSpam(user, from)
  }

  top (amount) {
    return Object.entries(this.storage.scores)
      .map(([name, score]) => ({ name, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, amount)
  }

  bottom (amount) {
    return this.top(Infinity).reverse().slice(0, amount)
  }
}
