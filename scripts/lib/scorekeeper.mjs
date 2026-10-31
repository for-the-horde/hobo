// Score storage for plusplus.mjs, ported from hubot-plusplus 1.4.0 (ajacksified).
//
// The brain layout is unchanged so hobo's existing karma keeps working:
//   robot.brain.data.plusPlus = {
//     scores:  { <name>: <number> },
//     reasons: { <name>: { <reason>: <number> } },
//     log:     { <from>: { <name>: <ISO date of last vote> } },
//     last:    { <room>: { user: <name>, reason: <reason> } }
//   }

const SPAM_WINDOW_MS = 5 * 1000

export default class ScoreKeeper {
  constructor (robot) {
    this.robot = robot
    const storageLoaded = () => {
      const data = this.robot.brain.data
      data.plusPlus ??= { scores: {}, log: {}, reasons: {}, last: {} }
      this.storage = data.plusPlus
      for (const key of ['scores', 'log', 'reasons', 'last']) {
        if (typeof this.storage[key] !== 'object' || this.storage[key] === null) this.storage[key] = {}
      }
    }
    this.robot.brain.on('loaded', storageLoaded)
    storageLoaded() // in case the brain loaded before this script
  }

  getUser (user) {
    this.storage.scores[user] ??= 0
    this.storage.reasons[user] ??= {}
    return user
  }

  saveUser (user, from, room, reason) {
    this.saveScoreLog(user, from, room, reason)
    this.robot.brain.save()
    return [this.storage.scores[user], this.storage.reasons[user][reason] || 'none']
  }

  add (user, from, room, reason) {
    return this.#change(user, from, room, reason, 1)
  }

  subtract (user, from, room, reason) {
    return this.#change(user, from, room, reason, -1)
  }

  #change (user, from, room, reason, delta) {
    if (!this.validate(user, from)) return [null, null]
    user = this.getUser(user)
    this.storage.scores[user] += delta
    if (reason) {
      this.storage.reasons[user][reason] = (this.storage.reasons[user][reason] || 0) + delta
    }
    return this.saveUser(user, from, room, reason)
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

  saveScoreLog (user, from, room, reason) {
    if (typeof this.storage.log[from] !== 'object' || this.storage.log[from] === null) {
      this.storage.log[from] = {}
    }
    this.storage.log[from][user] = new Date().toISOString()
    this.storage.last[room] = { user, reason }
  }

  last (room) {
    const last = this.storage.last[room]
    if (last == null) return [undefined, undefined]
    if (typeof last === 'string') return [last, '']
    return [last.user, last.reason]
  }

  isSpam (user, from) {
    this.storage.log[from] ??= {}
    const submitted = this.storage.log[from][user]
    if (!submitted) return false
    const isSpam = new Date(submitted).getTime() + SPAM_WINDOW_MS > Date.now()
    if (!isSpam) delete this.storage.log[from][user]
    return isSpam
  }

  validate (user, from) {
    return user != null && user !== '' && user !== from && !this.isSpam(user, from)
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
