import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { startRobot } from './helpers.mjs'
import { EMOJI } from '../scripts/story.mjs'
import { findAnEmojiFor } from '../scripts/emoji.mjs'
import { urbanDict } from '../scripts/urban.mjs'

const SCRIPTS = [
  'code-of-conduct.mjs', 'emoji.mjs', 'flip.mjs', 'lore.mjs', 'origin-story.mjs', 'story.mjs', 'urban.mjs'
]

describe('hobo scripts', () => {
  let bot
  beforeEach(async () => { bot = await startRobot(SCRIPTS) })
  afterEach(() => bot.stop())

  it('DMs the Slack-formatted code of conduct to the requester', async () => {
    const coc = await readFile('code_of_conduct.md', 'utf8')
    const out = await bot.say('hobo code of conduct', { from: 'carol' })
    assert.equal(out.length, 2)
    assert.deepEqual(out[0], { kind: 'send', room: 'U-carol', text: coc })
    assert.deepEqual(out[1], { kind: 'reply', room: 'C-general', text: 'Sent via DM! Thanks for asking... :hug:' })
    assert.match(coc, /^\*For the Horde Code of Conduct\*/)
  })

  it('reloads the code of conduct without also DMing it', async () => {
    const out = await bot.say('hobo reload code of conduct')
    assert.deepEqual(out.map((o) => o.text), ['Done!'])
  })

  it('tells the lore and origin story', async () => {
    const lore = await bot.say('hobo lore')
    assert.match(lore[0].text, /^A long time ago… /)
    assert.match(lore[0].text, /story by @whoisjake, FtH Historian$/)
    const origin = await bot.say('hobo origin story')
    assert.match(origin[0].text, /^Born on Tuesday, Feb 3, 2015/)
    assert.match(origin[0].text, /story by @experimatt$/)
  })

  it('tells a five-emoji story', async () => {
    assert.equal(EMOJI.length, 868)
    const out = await bot.say('hobo tell me a story')
    const parts = out[0].text.split(' ')
    assert.equal(parts.length, 5)
    for (const p of parts) assert.ok(EMOJI.includes(p))
  })

  it('flips and unflips', async () => {
    assert.equal((await bot.say('hobo flip'))[0].text, '(╯°□°）╯︵ ┻━┻')
    assert.equal((await bot.say('hobo rage flip hello'))[0].text, '(ノಠ益ಠ)ノ彡 oʃʃǝɥ')
    assert.equal((await bot.say('hobo unflip me', { from: 'dave' }))[0].text, 'dave ノ( º _ ºノ)')
  })

  it('translates words to emoji', async () => {
    assert.equal(findAnEmojiFor('pizza'), '🍕')
    assert.equal(findAnEmojiFor('cats'), findAnEmojiFor('cat'))
    assert.equal(findAnEmojiFor('xyzzy'), 'xyzzy')
    const out = await bot.say('hobo emoji I love pizza')
    assert.match(out[0].text, /🍕$/)
  })
})

describe('urban', () => {
  const fakeFetch = (body, ok = true) => async () => ({ ok, status: ok ? 200 : 503, json: async () => body })

  it('returns the first definition', async () => {
    const entry = await urbanDict('hobo', fakeFetch({ list: [{ word: 'hobo', definition: 'a bot' }] }))
    assert.equal(entry.definition, 'a bot')
  })
  it('returns null when nothing is found', async () => {
    assert.equal(await urbanDict('xyzzy', fakeFetch({ list: [] })), null)
  })
  it('throws on HTTP errors', async () => {
    await assert.rejects(urbanDict('x', fakeFetch({}, false)), /HTTP 503/)
  })
})
