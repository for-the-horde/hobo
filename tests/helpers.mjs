import { Robot } from 'hubot'
import dummyAdapter from './doubles/DummyAdapter.mjs'

// Starts a robot named "hobo" on the dummy adapter with the given scripts loaded.
// Returns helpers that send a message and collect everything hobo says back.
export async function startRobot (scripts, { brain } = {}) {
  process.env.EXPRESS_PORT = '0'
  const robot = new Robot(dummyAdapter, true, 'hobo')
  await robot.loadAdapter()
  await robot.run()
  if (brain) robot.brain.mergeData(structuredClone(brain))
  for (const script of scripts) await robot.loadFile('./scripts', script)

  const said = []
  robot.on('send', (envelope, ...strings) => said.push({ kind: 'send', room: envelope.room, text: strings.join('') }))
  robot.on('reply', (envelope, ...strings) => said.push({ kind: 'reply', room: envelope.room, text: strings.join('') }))

  const user = (name, id = `U-${name}`) => robot.brain.userForId(id, { name, room: 'C-general' })

  const say = async (text, { from = 'alice', room = 'C-general' } = {}) => {
    const start = said.length
    await robot.adapter.say(user(from), text, room)
    // let async listeners finish
    await new Promise((resolve) => setImmediate(resolve))
    return said.slice(start)
  }

  const stop = () => {
    robot.shutdown()
    delete process.env.EXPRESS_PORT
  }

  return { robot, say, said, stop, user }
}
