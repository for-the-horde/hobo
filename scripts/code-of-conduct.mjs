// Description:
//   DMs the For the Horde code of conduct to whoever asks for it.
//
// Configuration:
//   HUBOT_CODE_OF_CONDUCT_FILE - Path to the Slack-formatted code of conduct.
//                                Default: code_of_conduct.md in the repo root.
//
// Commands:
//   hubot code of conduct - DMs you the code of conduct
//   hubot reload code of conduct - Re-reads the code of conduct file

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const DEFAULT_FILE = fileURLToPath(new URL('../code_of_conduct.md', import.meta.url))

export default async (robot) => {
  const file = process.env.HUBOT_CODE_OF_CONDUCT_FILE || DEFAULT_FILE
  let codeOfConduct = null

  const load = async () => {
    codeOfConduct = await readFile(file, 'utf8')
  }

  try {
    await load()
  } catch (err) {
    robot.logger.error(`code-of-conduct: could not read ${file}: ${err.message}`)
  }

  robot.respond(/reload code of conduct/i, async (res) => {
    try {
      await load()
      await res.reply('Done!')
    } catch (err) {
      robot.logger.error(`code-of-conduct: could not reload ${file}: ${err.message}`)
      await res.reply("I couldn't reload the code of conduct. Please ask my keeper to check on me.")
    }
  })

  robot.respond(/(?<!reload )code of conduct/i, async (res) => {
    if (!codeOfConduct) {
      await res.reply("Sorry, I can't find our code of conduct right now. Please ask my keeper to check on me.")
      return
    }
    // Posting to a user ID delivers the message to the app's DM with that user.
    await robot.messageRoom(res.message.user.id, codeOfConduct)
    await res.reply('Sent via DM! Thanks for asking... :hug:')
  })
}
