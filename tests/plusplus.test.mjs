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

  it('writes vote logs as ISO strings in the existing layout', async () => {
    await bot.say('justin++', { from: 'alice' })
    const stamp = bot.robot.brain.data.plusPlus.log.alice.justin
    assert.match(stamp, /^\d{4}-\d\d-\d\dT/)
    assert.deepEqual(bot.robot.brain.data.plusPlus.last['C-general'], { user: 'justin', reason: undefined })
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
