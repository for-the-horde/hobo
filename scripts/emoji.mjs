// Description:
//   Translates a sentence into emoji.
//   Heavily based on: https://github.com/muan/emojilib
//                     https://github.com/notwaldorf/emoji-translate
//
// Commands:
//   hubot emoji <sentence> - Translates a sentence.
//
// Author:
//   Jake Good (@whoisjake)

import { createRequire } from 'node:module'

// emojilib 4.x: { "<emoji char>": ["<name>", "<keyword>", ...] }
const emojis = createRequire(import.meta.url)('emojilib')
const entries = Object.entries(emojis)

export function findAnEmojiFor (word) {
  const keyword = word.trim().toLowerCase()
  if (!keyword || keyword === 'it') return word
  const candidates = [keyword]
  if (keyword.length > 2 && keyword.endsWith('s')) candidates.push(keyword.slice(0, -1))
  if (keyword.length > 1) candidates.push(`${keyword}s`)

  for (const [char, keywords] of entries) {
    if (candidates.some((c) => keywords.includes(c))) return char
  }
  return word
}

export default (robot) => {
  robot.respond(/(emoji)\s(.*)/i, async (res) => {
    const sentence = res.match[2].split(' ').map(findAnEmojiFor)
    await res.send(sentence.join(' '))
  })
}
