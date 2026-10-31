// Description:
//   Remember messages and quote them back. Ported from hubot-quote 3.0.0 (b3nj4m).
//   To make "remember" possible, hobo keeps the last few messages from each
//   person in the channels it's in.
//
// Configuration:
//   HUBOT_QUOTE_CACHE_SIZE=N - Messages kept per person for possible remembering (default 25)
//   HUBOT_QUOTE_STORE_SIZE=N - Quotes kept per person (default 100)
//
// Commands:
//   hubot remember <user> <text> - remember most recent message from <user> containing <text>
//   hubot forget <user> <text> - forget most recent remembered message from <user> containing <text>
//   hubot quote [<user>] [<text>] - quote a random remembered message that is from <user> and/or contains <text>
//   hubot quotemash [<user>] [<text>] - quote some random remembered messages that are from <user> and/or contain <text>
//   hubot <text>|<user>mash - quote some random remembered messages that from <user> or contain <text>
//
// Author:
//   b3nj4m (original), ported for hobo

import {
  decodeLegacy, findAll, findFirst, messageToString, randomItem, randomItems, slimMessage
} from './lib/quote-store.mjs'

const CACHE_SIZE = parseInt(process.env.HUBOT_QUOTE_CACHE_SIZE, 10) || 25
const STORE_SIZE = parseInt(process.env.HUBOT_QUOTE_STORE_SIZE, 10) || 100
const MASH_LIMIT = 10

const USER_NOT_FOUND = [(u) => `I don't know any ${u}`, (u) => `${u} is lame.`]
const NOT_FOUND = [(t) => `I don't know anything about ${t}.`, () => 'Wat.']
const EMPTY_STORE = "I don't remember any quotes..."

const escapeRegex = (s) => s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')

export default (robot) => {
  // hubot-redis-brain emits 'connected' once the stored brain is merged in.
  // Before that the quote tables aren't loaded, so ignore everything.
  let ready = false
  let store = {}
  let cache = {}

  const load = () => {
    store = decodeLegacy(robot.brain.get('quoteMessageStore')) ?? {}
    // hubot-quote 3.x's cache was msgpack and is years stale; start fresh.
    const rawCache = robot.brain.get('quoteMessageCache')
    cache = rawCache && !Array.isArray(rawCache) && typeof rawCache === 'object' ? rawCache : {}
    robot.brain.set({ quoteMessageStore: store, quoteMessageCache: cache })
  }

  robot.brain.on('connected', () => {
    load()
    ready = true
  })

  const save = () => {
    robot.brain.set({ quoteMessageStore: store, quoteMessageCache: cache })
  }

  const findUsers = (username) => robot.brain.usersForFuzzyName(username.replace(/^@/, ''))

  const names = [robot.name, robot.alias].filter(Boolean).map(escapeRegex).join('|')
  const addressedToBot = new RegExp(`^\\s*[@]?(?:${names})[:,]?\\s`, 'i')

  robot.respond(/remember ([^\s]*) (.*)/i, async (res) => {
    if (!ready) return
    const [, username, text] = res.match
    const users = findUsers(username)
    const match = findFirst(cache, text, users)

    if (match) {
      store[match.userId] = [match.message, ...(store[match.userId] ?? [])].slice(0, STORE_SIZE)
      cache[match.userId].splice(match.index, 1)
      save()
      await res.send(`remembering ${messageToString(match.message)}`)
    } else if (users.length === 0) {
      await res.send(randomItem(USER_NOT_FOUND)(username))
    } else {
      await res.send(randomItem(NOT_FOUND)(text))
    }
  })

  robot.respond(/forget ([^\s]*) (.*)/i, async (res) => {
    if (!ready) return
    const [, username, text] = res.match
    const users = findUsers(username)
    const match = findFirst(store, text, users)

    if (match) {
      store[match.userId].splice(match.index, 1)
      save()
      await res.send(`forgot ${messageToString(match.message)}`)
    } else if (users.length === 0) {
      await res.send(randomItem(USER_NOT_FOUND)(username))
    } else {
      await res.send(randomItem(NOT_FOUND)(text))
    }
  })

  // An optional leading username narrows the search; if it isn't a known user,
  // it's treated as part of the search text.
  const resolve = (username, text) => {
    if (!username) return { users: null, text }
    const users = findUsers(username)
    if (users.length > 0) return { users, text }
    return { users: null, text: username + (text ? ` ${text}` : '') }
  }

  robot.respond(/quote($| )([^\s]*)?( (.*))?/i, async (res) => {
    if (!ready) return
    const { users, text } = resolve(res.match[2], res.match[4] || '')
    const found = findAll(store, text, users)

    if (found.length > 0) await res.send(messageToString(randomItem(found)))
    else if (!text) await res.send(EMPTY_STORE)
    else await res.send(randomItem(NOT_FOUND)(text))
  })

  robot.respond(/(quotemash( ([^\s]*))?( (.*))?)|((([^\s]*))mash)/i, async (res) => {
    if (!ready) return
    const { users, text } = resolve(res.match[3] || res.match[8] || '', res.match[5] || '')
    const found = findAll(store, text, users)

    if (found.length > 0) await res.send(...randomItems(found, MASH_LIMIT).map(messageToString))
    else if (!text) await res.send(EMPTY_STORE)
    else await res.send(randomItem(NOT_FOUND)(text))
  })

  // Keep each person's recent messages so "remember" can find them.
  robot.hear(/.*/, (res) => {
    if (!ready) return
    const text = res.message.text
    const user = res.message.user
    if (!text || !user?.id || addressedToBot.test(text)) return
    const recent = cache[user.id] ?? []
    cache[user.id] = [slimMessage({ text, user }), ...recent].slice(0, CACHE_SIZE)
    save()
  })
}
