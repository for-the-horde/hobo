
'use strict'
import { Adapter, TextMessage } from 'hubot'

export class DummyAdapter extends Adapter {
  constructor (robot) {
    super(robot)
    this.name = 'DummyAdapter'
    this.messages = new Set()
    this.reactions = []
    this.client = { web: { reactions: { add: async (args) => { this.reactions.push(args) } } } }
  }

  async send (envelope, ...strings) {
    this.emit('send', envelope, ...strings)
    this.robot.emit('send', envelope, ...strings)
  }

  async reply (envelope, ...strings) {
    this.emit('reply', envelope, ...strings)
    this.robot.emit('reply', envelope, ...strings)
  }

  async topic (envelope, ...strings) {
    this.emit('topic', envelope, ...strings)
    this.robot.emit('topic', envelope, ...strings)
  }

  async play (envelope, ...strings) {
    this.emit('play', envelope, ...strings)
    this.robot.emit('play', envelope, ...strings)
  }

  async run () {
    // This is required to get the scripts loaded
    this.emit('connected')
  }

  close () {
    this.emit('closed')
  }

  async say (user, message, room, { ts, thread } = {}) {
    this.messages.add(message)
    user.room = room
    const textMessage = new TextMessage(user, message, ts)
    if (thread != null) textMessage.thread_ts = thread
    await this.robot.receive(textMessage)
  }
}
export default {
  async use (robot) {
    return new DummyAdapter(robot)
  }
}
