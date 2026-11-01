// Helpers for quote.mjs, ported from hubot-quote 3.0.0 (b3nj4m).
//
// Brain layout (robot.brain private keys), plain JSON:
//   quoteMessageStore: { <user id>: [ { text, user: { id, name } }, ... ] }  newest first
//   quoteMessageCache: { <user id>: [ { text, user: { id, name } }, ... ] }  newest first
// hubot-quote 3.x stored both as msgpack bytes; decodeLegacy() reads that format.

import { decode } from '@msgpack/msgpack'
import { stemmer } from 'stemmer'

// Roughly the English stop words that natural's tokenizeAndStem() dropped.
const STOP_WORDS = new Set(`a about above after again against all am an and any are as at be because been
before being below between both but by can did do does doing down during each few for from further had
has have having he her here hers herself him himself his how i if in into is it its itself just me more
most my myself no nor not now of off on once only or other our ours ourselves out over own same she
should so some such than that the their theirs them themselves then there these they this those through
to too under until up very was we were what when where which while who whom why will with you your yours
yourself yourselves`.split(/\s+/))

export function uniqueStems (text) {
  const words = String(text).toLowerCase().match(/[a-z0-9]+/g) ?? []
  return [...new Set(words.filter((w) => !STOP_WORDS.has(w)).map((w) => stemmer(w)))]
}

// Keep only what a quote needs; old entries carried whole Slack profiles.
export function slimMessage (message) {
  return {
    text: String(message?.text ?? ''),
    user: { id: message?.user?.id, name: message?.user?.name }
  }
}

function slimTable (table) {
  const out = {}
  for (const [userId, messages] of Object.entries(table ?? {})) {
    if (Array.isArray(messages)) out[userId] = messages.map(slimMessage)
  }
  return out
}

// Accepts the current plain-object format or hubot-quote's legacy encodings
// (msgpack bytes as a number array or a serialized Buffer, or a JSON string).
export function decodeLegacy (value) {
  if (value == null) return null
  if (Array.isArray(value)) return slimTable(decode(Uint8Array.from(value)))
  if (value.type === 'Buffer' && Array.isArray(value.data)) return slimTable(decode(Uint8Array.from(value.data)))
  if (typeof value === 'string') return slimTable(JSON.parse(value))
  if (typeof value === 'object') return value
  return null
}

export function messageToString (message) {
  return `${message.user.name}: ${message.text}`
}

function matches (searchStems, searchText, message) {
  if (searchText === '') return true
  const stems = uniqueStems(message.text)
  const stemMatch = searchStems.length > 0 && searchStems.every((s) => stems.includes(s))
  return stemMatch || message.text.toLowerCase().includes(searchText.toLowerCase())
}

function userIdsFor (table, users) {
  return users ? users.map((u) => u.id) : Object.keys(table)
}

export function findAll (table, text, users) {
  const stems = uniqueStems(text)
  return userIdsFor(table, users).flatMap((id) => (table[id] ?? []).filter((m) => matches(stems, text, m)))
}

export function findFirst (table, text, users) {
  const stems = uniqueStems(text)
  for (const userId of userIdsFor(table, users)) {
    const messages = table[userId] ?? []
    const index = messages.findIndex((m) => matches(stems, text, m))
    if (index !== -1) return { message: messages[index], index, userId }
  }
  return null
}

// Random subset without replacement.
export function randomItems (list, limit) {
  const copy = [...list]
  const picked = []
  while (copy.length > 0 && picked.length < limit) {
    picked.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0])
  }
  return picked
}

export const randomItem = (list) => list[Math.floor(Math.random() * list.length)]
