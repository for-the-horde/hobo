import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { encode } from '@msgpack/msgpack'
import { startRobot } from './helpers.mjs'
import { decodeLegacy, uniqueStems } from '../scripts/lib/quote-store.mjs'

const profile = (id, name) => ({ id, name, real_name: name, email_address: `${name}@example.com`, slack: { profile: {} } })

// Shaped like hobo's real brain: hubot-quote 3.x stored msgpack bytes as a number array.
const legacyBrain = () => ({
  users: {
    'U-ian': { id: 'U-ian', name: 'ian' },
    'U-kara': { id: 'U-kara', name: 'kara' }
  },
  _private: {
    quoteMessageStore: Array.from(encode({
      'U-kara': [{ text: 'a house without fireballs is not a home', user: profile('U-kara', 'kara'), stems: ['hous'] }],
      'U-ian': [{ text: 'ship it on friday', user: profile('U-ian', 'ian'), stems: ['ship'] }]
    })),
    quoteMessageCache: Array.from(encode({ 'U-ian': [{ text: 'stale 2017 message', user: profile('U-ian', 'ian') }] }))
  },
  plusPlus: { scores: {}, reasons: {}, log: {}, last: {} }
})

describe('quote', () => {
  let bot
  beforeEach(async () => { bot = await startRobot(['quote.mjs'], { brain: legacyBrain() }) })
  afterEach(() => bot.stop())

  it('migrates the legacy msgpack store to plain JSON without profiles', () => {
    const store = bot.robot.brain.get('quoteMessageStore')
    assert.deepEqual(store['U-kara'], [{ text: 'a house without fireballs is not a home', user: { id: 'U-kara', name: 'kara' } }])
    assert.deepEqual(bot.robot.brain.get('quoteMessageCache'), {})
  })

  it('quotes old quotes by user and by text (stemmed)', async () => {
    assert.equal((await bot.say('hobo quote kara'))[0].text, 'kara: a house without fireballs is not a home')
    assert.equal((await bot.say('hobo quote shipping'))[0].text, 'ian: ship it on friday')
    assert.equal((await bot.say('hobo quote @ian'))[0].text, 'ian: ship it on friday')
  })

  it('remembers a recent message, then forgets it', async () => {
    await bot.say('the build is on fire again', { from: 'ian' })
    await bot.say('unrelated chatter', { from: 'ian' })
    const out = await bot.say('hobo remember ian fire')
    assert.equal(out[0].text, 'remembering ian: the build is on fire again')
    assert.equal(bot.robot.brain.get('quoteMessageStore')['U-ian'][0].text, 'the build is on fire again')

    assert.equal((await bot.say('hobo forget ian fire'))[0].text, 'forgot ian: the build is on fire again')
    assert.equal((await bot.say('hobo quote ian'))[0].text, 'ian: ship it on friday')
  })

  it("doesn't cache messages addressed to hobo", async () => {
    await bot.say('hobo tell me about fire', { from: 'ian' })
    const out = await bot.say('hobo remember ian fire')
    assert.match(out[0].text, /^(I don't know anything about fire\.|Wat\.)$/)
  })

  it('caps the per-person cache', async () => {
    for (let i = 0; i < 30; i++) await bot.say(`message ${i}`, { from: 'ian' })
    assert.equal(bot.robot.brain.get('quoteMessageCache')['U-ian'].length, 25)
  })

  it('mashes several quotes', async () => {
    const out = await bot.say('hobo quotemash')
    assert.equal(out.length, 1)
    assert.ok(out[0].text.includes('kara: a house without fireballs'))
    assert.ok(out[0].text.includes('ian: ship it on friday'))
  })

  it('handles unknown users and empty results', async () => {
    assert.match((await bot.say('hobo remember nobody something'))[0].text, /^(I don't know any nobody|nobody is lame\.)$/)
    assert.match((await bot.say('hobo quote xyzzy'))[0].text, /^(I don't know anything about xyzzy\.|Wat\.)$/)
  })
})

describe('quote before the brain loads', () => {
  it('ignores everything until the brain is connected', async () => {
    const bot = await startRobot(['quote.mjs'], { brain: legacyBrain(), connect: false })
    try {
      assert.deepEqual(await bot.say('hobo quote kara'), [])
      await bot.say('early message', { from: 'ian' })
      bot.loadBrain()
      assert.deepEqual(bot.robot.brain.get('quoteMessageCache'), {})
      assert.equal((await bot.say('hobo quote kara'))[0].text, 'kara: a house without fireballs is not a home')
    } finally {
      bot.stop()
    }
  })
})

describe('quote helpers', () => {
  it('stems and drops stop words', () => {
    assert.deepEqual(uniqueStems('A house is not a home, houses!'), ['hous', 'home'])
  })
  it('decodes every legacy encoding', () => {
    const table = { U1: [{ text: 'hi', user: { id: 'U1', name: 'x', email_address: 'e' } }] }
    const slim = { U1: [{ text: 'hi', user: { id: 'U1', name: 'x' } }] }
    const bytes = encode(table)
    assert.deepEqual(decodeLegacy(Array.from(bytes)), slim)
    assert.deepEqual(decodeLegacy({ type: 'Buffer', data: Array.from(bytes) }), slim)
    assert.deepEqual(decodeLegacy(JSON.stringify(table)), slim)
    assert.equal(decodeLegacy(null), null)
  })
})
