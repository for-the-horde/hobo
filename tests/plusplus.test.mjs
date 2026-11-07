import { describe, it, beforeEach, afterEach } from 'node:test'
import assert from 'node:assert/strict'
import { startRobot } from './helpers.mjs'
import { sparkline, cleanName } from '../scripts/plusplus.mjs'

// Shaped like hobo's real brain (hubot-plusplus 1.4.0 format).
const legacyBrain = () => ({
  users: {},
  _private: {},
  plusPlus: {
    scores: { justin: 217, whoisjake: 176, ian: 148 },
    reasons: { justin: { 'reviving hobo': 3 }, whoisjake: {}, ian: {} },
    log: { ian: { justin: '2022-09-02T16:40:15.422Z' } },
    last: { 'C-general': { user: 'ian', reason: 'being ian' }, 'C-legacy': 'whoisjake' }
  }
})

describe('plusplus', () => {
  let bot
  beforeEach(async () => { bot = await startRobot(['plusplus.mjs'], { brain: legacyBrain() }) })
  afterEach(() => bot.stop())

  it('adds to an existing score from the old brain', async () => {
    const out = await bot.say('justin++', { from: 'alice' })
    assert.equal(out[0].text, 'justin has 218 points')
    assert.equal(bot.robot.brain.data.plusPlus.scores.justin, 218)
  })

  it('handles @mentions, reasons and the reason tally', async () => {
    const out = await bot.say('@justin++ for reviving hobo', { from: 'alice' })
    assert.equal(out[0].text, 'justin has 218 points, 4 of which are for reviving hobo.')
  })

  it('subtracts with -- and the em dash', async () => {
    await bot.say('ian--', { from: 'alice' })
    const out = await bot.say('whoisjake—', { from: 'bob' })
    assert.equal(bot.robot.brain.data.plusPlus.scores.ian, 147)
    assert.equal(out[0].text, 'whoisjake has 175 points')
  })

  it('creates new names and pluralizes correctly', async () => {
    const out = await bot.say('newperson++ for showing up', { from: 'alice' })
    assert.equal(out[0].text, 'newperson has 1 point for showing up.')
  })

  it('refuses self-votes and rapid repeat votes', async () => {
    assert.deepEqual(await bot.say('alice++', { from: 'alice' }), [])
    await bot.say('ian++', { from: 'bob' })
    assert.deepEqual(await bot.say('ian++', { from: 'bob' }), [])
    assert.equal(bot.robot.brain.data.plusPlus.scores.ian, 149)
  })

  it('a bare ++ applies to the last name voted on in that room', async () => {
    const out = await bot.say('++', { from: 'alice' })
    assert.equal(out[0].text, 'ian has 149 points, 1 of which is for being ian.')
    const legacy = await bot.say('++', { from: 'alice', room: 'C-legacy' })
    assert.equal(legacy[0].text, 'whoisjake has 177 points')
  })

  it('writes vote logs as ISO strings and remembers the last vote per room and thread', async () => {
    await bot.say('justin++', { from: 'alice', ts: '100.1' })
    const { log, last, lastByThread } = bot.robot.brain.data.plusPlus
    assert.match(log.alice.justin, /^\d{4}-\d\d-\d\dT/)
    assert.deepEqual(last['C-general'], { user: 'justin', reason: undefined, thread: '100.1' })
    assert.deepEqual(lastByThread['C-general'], { '100.1': { user: 'justin', reason: undefined } })
  })

  it('shows a score with reasons', async () => {
    const out = await bot.say('hobo score justin')
    assert.equal(out[0].text, 'justin has 217 points. Here are some raisins:\nreviving hobo: 3 points')
  })

  it('lists top and bottom', async () => {
    const top = await bot.say('hobo top 2')
    assert.equal(top[0].text.split('\n').slice(1).join('\n'), '1. justin : 217\n2. whoisjake : 176')
    const bottom = await bot.say('hobo bottom 1')
    assert.equal(bottom[0].text, '1. ian : 148')
  })

  it('erases a score', async () => {
    const out = await bot.say('hobo erase ian')
    assert.equal(out[0].text, 'Erased points for ian')
    assert.equal(bot.robot.brain.data.plusPlus.scores.ian, undefined)
  })

  it('serves scores as JSON', async () => {
    const port = bot.robot.server.address().port
    const res = await fetch(`http://localhost:${port}/hobo/scores?limit=1`)
    assert.deepEqual(await res.json(), [{ name: 'justin', score: 217 }])
  })
})

describe('plusplus in threads', () => {
  let bot
  beforeEach(async () => { bot = await startRobot(['thread-replies.mjs', 'plusplus.mjs'], { brain: legacyBrain() }) })
  afterEach(() => bot.stop())

  it('a bare ++ in a thread applies to the last name voted on in that thread', async () => {
    await bot.say('newperson++ for showing up', { from: 'alice', ts: '100.1' })
    await bot.say('ian++', { from: 'carol', ts: '200.1' })
    const out = await bot.say('++', { from: 'bob', ts: '100.2', thread: '100.1' })
    assert.equal(out[0].text, 'newperson has 2 points, 2 of which are for showing up.')
    assert.equal(out[0].thread, '100.1')
    assert.deepEqual(bot.robot.adapter.reactions, [])
  })

  it('a bare ++ in a thread with no votes in it does nothing', async () => {
    await bot.say('newperson++', { from: 'alice', ts: '100.1' })
    await bot.say(':siren:', { from: 'bob', ts: '300.1' })
    assert.deepEqual(await bot.say('++', { from: 'carol', ts: '300.2', thread: '300.1' }), [])
    assert.equal(bot.robot.brain.data.plusPlus.scores.newperson, 1)
  })

  it('a top-level bare ++ posts the score in the thread of the vote it repeats and marks the ++', async () => {
    await bot.say('newperson++ for showing up', { from: 'alice', ts: '100.1' })
    const out = await bot.say('++', { from: 'bob', ts: '100.5' })
    assert.equal(out[0].text, 'newperson has 2 points, 2 of which are for showing up.')
    assert.equal(out[0].thread, '100.1')
    assert.deepEqual(bot.robot.adapter.reactions, [{ channel: 'C-general', name: 'thread', timestamp: '100.5' }])

    const later = await bot.say('++', { from: 'carol', ts: '100.7', thread: '100.1' })
    assert.equal(later[0].text, 'newperson has 3 points, 3 of which are for showing up.')
  })

  it("a top-level bare ++ repeats the channel's latest vote even when it was in a thread", async () => {
    await bot.say('newperson++', { from: 'alice', ts: '100.1' })
    await bot.say(':siren: ++', { from: 'bob', ts: '300.2', thread: '300.1' })
    const out = await bot.say('++', { from: 'carol', ts: '400.1' })
    assert.equal(out[0].text, ':siren: has 2 points')
    assert.equal(out[0].thread, '300.1')
  })

  it('still counts the vote when the reaction cannot be added', async () => {
    bot.robot.adapter.client.web.reactions.add = async () => { throw new Error('An API error occurred: missing_scope') }
    const votes = []
    bot.robot.on('plus-one', (vote) => votes.push(vote))
    await bot.say('newperson++', { from: 'alice', ts: '100.1' })
    const out = await bot.say('++', { from: 'bob', ts: '100.5' })
    assert.equal(out[0].thread, '100.1')
    assert.equal(votes.length, 2)
  })

  it('caps the threads remembered per room, dropping the least recently voted', async () => {
    for (let i = 0; i < 50; i++) await bot.say('newperson++', { from: `voter${i}`, ts: `${100 + i}.1` })
    await bot.say('++', { from: 'alice', ts: '100.2', thread: '100.1' })
    await bot.say('ian++', { from: 'bob', ts: '200.1' })
    const threads = bot.robot.brain.data.plusPlus.lastByThread['C-general']
    assert.equal(Object.keys(threads).length, 50)
    assert.ok(Object.hasOwn(threads, '100.1'))
    assert.ok(!Object.hasOwn(threads, '101.1'))
    assert.deepEqual(await bot.say('++', { from: 'carol', ts: '101.2', thread: '101.1' }), [])
  })

  it('a top-level bare ++ after a vote saved without a thread replies under the ++', async () => {
    const out = await bot.say('++', { from: 'alice', room: 'C-legacy', ts: '500.1' })
    assert.equal(out[0].text, 'whoisjake has 177 points')
    assert.equal(out[0].thread, '500.1')
    assert.deepEqual(bot.robot.adapter.reactions, [])
  })
})

describe('plusplus helpers', () => {
  it('cleans names like the original', () => {
    assert.equal(cleanName('@Justin: '), 'justin')
    assert.equal(cleanName(':tada:'), ':tada:')
  })
  it('draws a sparkline', () => {
    assert.equal(sparkline([1, 5, 10]), '▁▃▇')
    assert.equal(sparkline([3, 3]), '▁▁')
  })
})

describe('plusplus before the brain loads', () => {
  it('ignores votes and never saves until the brain is connected', async () => {
    const bot = await startRobot(['plusplus.mjs'], { brain: legacyBrain(), connect: false })
    let saves = 0
    bot.robot.brain.on('save', () => { saves++ })
    try {
      assert.deepEqual(await bot.say('justin++', { from: 'alice' }), [])
      assert.deepEqual(await bot.say('hobo erase justin', { from: 'alice' }), [])
      assert.equal(saves, 0)

      bot.loadBrain()
      const out = await bot.say('justin++', { from: 'alice' })
      assert.equal(out[0].text, 'justin has 218 points')
    } finally {
      bot.stop()
    }
  })
})

describe('plusplus reserved names', () => {
  let bot
  beforeEach(async () => { bot = await startRobot(['plusplus.mjs'], { brain: legacyBrain() }) })
  afterEach(() => bot.stop())

  it('refuses names and reasons that would touch Object.prototype', async () => {
    assert.deepEqual(await bot.say('constructor++', { from: 'alice' }), [])
    assert.deepEqual(await bot.say('__proto__++ for fun', { from: 'alice' }), [])
    assert.deepEqual(await bot.say('ian++ for __proto__', { from: 'alice' }), [])
    assert.equal(Object.hasOwn(bot.robot.brain.data.plusPlus.scores, 'constructor'), false)
    assert.equal(({}).fun, undefined)
    const top = await bot.say('hobo top 3')
    assert.equal(top[0].text.split('\n')[1], '1. justin : 217')
  })
})

describe('bot name vs alias', () => {
  it('answers to "hobo" even if Slack assigns the bot a different handle', async () => {
    const bot = await startRobot(['plusplus.mjs'], { brain: legacyBrain(), name: 'hobo2', alias: 'hobo' })
    try {
      const out = await bot.say('hobo score ian')
      assert.equal(out[0].text, 'ian has 148 points.')
    } finally {
      bot.stop()
    }
  })
})
