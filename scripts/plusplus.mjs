// Description:
//   Give or take away points. Keeps track and even prints out graphs.
//   Ported from hubot-plusplus 1.4.0 (ajacksified); its brain data still loads.
//
// Configuration:
//   HUBOT_PLUSPLUS_KEYWORD - keyword(s) for showing a score, pipe separated. Default: "score"
//   HUBOT_PLUSPLUS_REASONS - word used when listing reasons. Default: "raisins"
//   HUBOT_PLUSPLUS_CONJUNCTIONS - pipe separated reason conjunctions. Default: "for|because|cause|cuz|as"
//   HUBOT_PLUSPLUS_THREADS_PER_ROOM - threads per room that remember their last vote for a bare ++. Default: 50
//   HUBOT_PLUSPLUS_ADMINS - comma separated Slack user IDs that may erase, on top of workspace admins and owners
//
// Commands:
//   <name>++ [<reason>] - Increment score for a name (for a reason)
//   <name>-- [<reason>] - Decrement score for a name (for a reason)
//   ++ [<reason>] - Repeat the last vote (in this thread, if in one)
//   hubot score <name> - Display the score for a name and some of the reasons
//   hubot top <amount> - Display the top scoring <amount>
//   hubot bottom <amount> - Display the bottom scoring <amount>
//   hubot erase <name> [<reason>] - Remove the score for a name (for a reason). Admins only
//
// URLs:
//   GET /<robot name>/scores[?name=<name>][&direction=<top|bottom>][&limit=<10>]
//
// Author:
//   ajacksified (original), ported for hobo

import ScoreKeeper from './lib/scorekeeper.mjs'
import { replyThread, withThread } from './lib/threads.mjs'

const NAME_CHARS = "[\\s\\w'@.\\-:\\u3040-\\u30FF\\uFF01-\\uFF60\\u4E00-\\u9FA0]*"
const SPARK_TICKS = ['▁', '▂', '▃', '▅', '▆', '▇']

export function sparkline (numbers) {
  if (numbers.length === 0) return ''
  const max = Math.max(...numbers)
  const min = Math.min(...numbers)
  const step = (max - min) / (SPARK_TICKS.length - 1) || 1
  return numbers.map((n) => SPARK_TICKS[Math.round((n - min) / step)]).join('')
}

// Slack unfurls links in hobo's messages, so a reason with a URL in it would
// unfurl again on every ++ and score lookup. A code span is never linked or
// unfurled. This runs when a message is written, not when a reason is stored,
// so reasons already in the brain are covered too. Slack's own <url|label>
// markup is handled in case an older adapter stored it raw.
const SLACK_LINK = /<((?:https?:\/\/|www\.)[^>|\s]+)(?:\|[^>]*)?>/gi
const BARE_URL = /(?:https?:\/\/|www\.)[^\s<>`]+/gi
const TRAILING_PUNCTUATION = /[.,;:!?)\]}'"]+$/

export function quoteUrls (text) {
  if (!text) return text
  return text
    .replace(SLACK_LINK, '$1')
    .replace(BARE_URL, (url) => {
      const tail = url.match(TRAILING_PUNCTUATION)?.[0] ?? ''
      const core = url.slice(0, url.length - tail.length)
      return core ? `\`${core}\`${tail}` : url
    })
}

export function cleanName (name) {
  if (!name) return name
  const trailing = name.charAt(0) === ':' ? /(^\s*@)|([,\s]*$)/g : /(^\s*@)|([,:\s]*$)/g
  return name.replace(trailing, '').trim().toLowerCase()
}

export default (robot) => {
  const scoreKeeper = new ScoreKeeper(robot)
  const scoreKeyword = process.env.HUBOT_PLUSPLUS_KEYWORD || 'score'
  const reasonsKeyword = process.env.HUBOT_PLUSPLUS_REASONS || 'raisins'
  const conjunctions = process.env.HUBOT_PLUSPLUS_CONJUNCTIONS || 'for|because|cause|cuz|as'

  const voteRegex = new RegExp(`^(${NAME_CHARS})\\s*(\\+\\+|--|—)(?:\\s+(?:${conjunctions})\\s+(.+))?$`, 'i')

  const notReady = () => {
    if (scoreKeeper.ready) return false
    robot.logger.warn('plusplus: ignoring a karma command because the brain has not loaded yet')
    return true
  }

  // Needs the reactions:write scope; without it the vote still counts.
  const markThreaded = async (message) => {
    const reactions = robot.adapter.client?.web?.reactions
    if (reactions == null) return
    try {
      await reactions.add({ channel: message.room, name: 'thread', timestamp: message.id })
    } catch (err) {
      robot.logger.warn(`plusplus: could not add a :thread: reaction: ${err.message}`)
    }
  }

  robot.hear(voteRegex, async (res) => {
    if (notReady()) return
    let [, name, operator, reason] = res.match
    const from = (res.message.user.name || '').toLowerCase()
    const room = res.message.room
    let thread = replyThread(res.message)
    let pileOn = false

    reason = reason?.trim().toLowerCase()
    name = cleanName(name)
    if (reason != null && !scoreKeeper.isValidKey(reason)) return

    if (!name) {
      const inThread = res.message.thread_ts != null
      const [lastName, lastReason, lastThread] = inThread
        ? scoreKeeper.lastByThread(room, res.message.thread_ts)
        : scoreKeeper.last(room)
      name = lastName
      if (reason == null && lastReason) reason = lastReason
      if (!inThread && lastThread != null) {
        thread = lastThread
        pileOn = true
      }
    }

    const [score, reasonScore] = operator === '++'
      ? scoreKeeper.add(name, from, room, reason, thread)
      : scoreKeeper.subtract(name, from, room, reason, thread)

    if (score == null) return

    const shown = quoteUrls(reason)
    let message
    if (reason != null) {
      if (reasonScore === 1 || reasonScore === -1) {
        message = (score === 1 || score === -1)
          ? `${name} has ${score} point for ${shown}.`
          : `${name} has ${score} points, ${reasonScore} of which is for ${shown}.`
      } else {
        message = `${name} has ${score} points, ${reasonScore} of which are for ${shown}.`
      }
    } else {
      message = score === 1 ? `${name} has ${score} point` : `${name} has ${score} points`
    }

    if (pileOn) res.envelope = withThread(res.envelope, thread)
    await res.send(message)
    if (pileOn) await markThreaded(res.message)
    robot.emit('plus-one', { name, direction: operator, room, reason, from })
  })

  const extraAdmins = new Set((process.env.HUBOT_PLUSPLUS_ADMINS || '').split(',').map((id) => id.trim()).filter(Boolean))

  // Erasing is for Slack workspace admins and owners, plus HUBOT_PLUSPLUS_ADMINS.
  // Asks Slack on every erase, so someone who loses admin loses access right away.
  // If Slack can't be asked, the erase is refused.
  const canErase = async (user) => {
    if (extraAdmins.has(user?.id)) return true
    const users = robot.adapter.client?.web?.users
    if (users == null || user?.id == null) return false
    try {
      const { user: info } = await users.info({ user: user.id })
      return Boolean(info?.is_admin || info?.is_owner)
    } catch (err) {
      robot.logger.warn(`plusplus: could not check whether ${user.id} may erase: ${err.message}`)
      return false
    }
  }

  // The name is lazy so "erase justin for reviving hobo" leaves the reason to the reason group.
  robot.respond(new RegExp(`(?:erase )(${NAME_CHARS}?)(?:\\s+(?:for|because|cause|cuz)\\s+(.+))?$`, 'i'), async (res) => {
    if (notReady()) return
    let [, name, reason] = res.match
    const from = (res.message.user.name || '').toLowerCase()
    reason = reason?.trim().toLowerCase()
    name = cleanName(name)
    if (!name || !scoreKeeper.isValidKey(name) || (reason != null && !scoreKeeper.isValidKey(reason))) return

    if (!(await canErase(res.message.user))) {
      await res.reply("Sorry, you don't have authorization to do that.")
      return
    }

    scoreKeeper.erase(name, from, res.message.room, reason)
    await res.send(reason != null ? `Erased the following reason from ${name}: ${quoteUrls(reason)}` : `Erased points for ${name}`)
  })

  robot.respond(new RegExp(`(?:${scoreKeyword}) (?:for\\s+)?(.*)`, 'i'), async (res) => {
    if (notReady()) return
    const name = cleanName(res.match[1].trim())
    if (!name || !scoreKeeper.isValidKey(name)) return
    const score = scoreKeeper.scoreForUser(name)
    const reasons = scoreKeeper.reasonsForUser(name)

    if (reasons && Object.keys(reasons).length > 0) {
      const lines = Object.entries(reasons).map(([key, val]) => `\n${quoteUrls(key)}: ${val} points`).join('')
      await res.send(`${name} has ${score} points. Here are some ${reasonsKeyword}:${lines}`)
    } else {
      await res.send(`${name} has ${score} points.`)
    }
  })

  robot.respond(/(top|bottom) (\d+)/i, async (res) => {
    if (notReady()) return
    const direction = res.match[1].toLowerCase()
    const amount = parseInt(res.match[2], 10) || 10
    const tops = scoreKeeper[direction](amount)

    const message = tops.length > 0
      ? tops.map((t, i) => `${i + 1}. ${t.name} : ${t.score}`)
      : ['No scores to keep track of yet!']

    if (direction === 'top' && tops.length > 0) {
      const graphSize = Math.min(tops.length, amount, 20)
      message.unshift(sparkline(tops.slice(0, graphSize).map((t) => t.score)))
    }
    await res.send(message.join('\n'))
  })

  // Read-only JSON endpoint. The original's unauthenticated GET /normalize-points
  // (which rewrote everyone's scores) is intentionally not ported.
  robot.router.get(`/${robot.name}/scores`, (req, res) => {
    if (!scoreKeeper.ready) {
      res.status(503).json({ error: 'brain not loaded yet' })
      return
    }
    const { name, direction = 'top', limit = 10 } = req.query ?? {}
    if (name) {
      if (!scoreKeeper.isValidKey(String(name).toLowerCase())) {
        res.status(400).json({ error: 'invalid name' })
        return
      }
      res.json({ [name]: scoreKeeper.scoreForUser(String(name).toLowerCase()) })
      return
    }
    const dir = direction === 'bottom' ? 'bottom' : 'top'
    res.json(scoreKeeper[dir](parseInt(limit, 10) || 10))
  })
}
