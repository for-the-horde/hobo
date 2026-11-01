// Description:
//   Give or take away points. Keeps track and even prints out graphs.
//   Ported from hubot-plusplus 1.4.0 (ajacksified); brain data format is unchanged.
//
// Configuration:
//   HUBOT_PLUSPLUS_KEYWORD - keyword(s) for showing a score, pipe separated. Default: "score"
//   HUBOT_PLUSPLUS_REASONS - word used when listing reasons. Default: "raisins"
//   HUBOT_PLUSPLUS_CONJUNCTIONS - pipe separated reason conjunctions. Default: "for|because|cause|cuz|as"
//
// Commands:
//   <name>++ [<reason>] - Increment score for a name (for a reason)
//   <name>-- [<reason>] - Decrement score for a name (for a reason)
//   hubot score <name> - Display the score for a name and some of the reasons
//   hubot top <amount> - Display the top scoring <amount>
//   hubot bottom <amount> - Display the bottom scoring <amount>
//   hubot erase <name> [<reason>] - Remove the score for a name (for a reason)
//
// URLs:
//   GET /<robot name>/scores[?name=<name>][&direction=<top|bottom>][&limit=<10>]
//
// Author:
//   ajacksified (original), ported for hobo

import ScoreKeeper from './lib/scorekeeper.mjs'

const NAME_CHARS = "[\\s\\w'@.\\-:\\u3040-\\u30FF\\uFF01-\\uFF60\\u4E00-\\u9FA0]*"
const SPARK_TICKS = ['▁', '▂', '▃', '▅', '▆', '▇']

export function sparkline (numbers) {
  if (numbers.length === 0) return ''
  const max = Math.max(...numbers)
  const min = Math.min(...numbers)
  const step = (max - min) / (SPARK_TICKS.length - 1) || 1
  return numbers.map((n) => SPARK_TICKS[Math.round((n - min) / step)]).join('')
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

  robot.hear(voteRegex, async (res) => {
    if (notReady()) return
    let [, name, operator, reason] = res.match
    const from = (res.message.user.name || '').toLowerCase()
    const room = res.message.room

    reason = reason?.trim().toLowerCase()
    name = cleanName(name)
    if (reason != null && !scoreKeeper.isValidKey(reason)) return

    if (!name) {
      const [lastName, lastReason] = scoreKeeper.last(room)
      name = lastName
      if (reason == null && lastReason) reason = lastReason
    }

    const [score, reasonScore] = operator === '++'
      ? scoreKeeper.add(name, from, room, reason)
      : scoreKeeper.subtract(name, from, room, reason)

    if (score == null) return

    let message
    if (reason != null) {
      if (reasonScore === 1 || reasonScore === -1) {
        message = (score === 1 || score === -1)
          ? `${name} has ${score} point for ${reason}.`
          : `${name} has ${score} points, ${reasonScore} of which is for ${reason}.`
      } else {
        message = `${name} has ${score} points, ${reasonScore} of which are for ${reason}.`
      }
    } else {
      message = score === 1 ? `${name} has ${score} point` : `${name} has ${score} points`
    }

    await res.send(message)
    robot.emit('plus-one', { name, direction: operator, room, reason, from })
  })

  robot.respond(new RegExp(`(?:erase )(${NAME_CHARS})(?:\\s+(?:for|because|cause|cuz)\\s+(.+))?$`, 'i'), async (res) => {
    if (notReady()) return
    let [, name, reason] = res.match
    const from = (res.message.user.name || '').toLowerCase()
    const user = res.envelope.user
    reason = reason?.trim().toLowerCase()
    name = cleanName(name)
    if (!name || !scoreKeeper.isValidKey(name) || (reason != null && !scoreKeeper.isValidKey(reason))) return

    const auth = robot.auth
    const isAdmin = auth?.hasRole(user, 'plusplus-admin') || auth?.hasRole(user, 'admin')
    if (auth && !isAdmin) {
      await res.reply("Sorry, you don't have authorization to do that.")
      return
    }

    scoreKeeper.erase(name, from, res.message.room, reason)
    await res.send(reason != null ? `Erased the following reason from ${name}: ${reason}` : `Erased points for ${name}`)
  })

  robot.respond(new RegExp(`(?:${scoreKeyword}) (?:for\\s+)?(.*)`, 'i'), async (res) => {
    if (notReady()) return
    const name = cleanName(res.match[1].trim())
    if (!name || !scoreKeeper.isValidKey(name)) return
    const score = scoreKeeper.scoreForUser(name)
    const reasons = scoreKeeper.reasonsForUser(name)

    if (reasons && Object.keys(reasons).length > 0) {
      const lines = Object.entries(reasons).map(([key, val]) => `\n${key}: ${val} points`).join('')
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
