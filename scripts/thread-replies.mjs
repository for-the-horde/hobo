// Description:
//   Posts every reply in a thread under the message that triggered it, so
//   hobo's replies (and the ++ pile-ons that follow them) stay out of the
//   channel. Replies in 1:1 DMs aren't threaded.

import { replyThread, withThread } from './lib/threads.mjs'

export default (robot) => {
  robot.responseMiddleware(async (context) => {
    const { envelope } = context.response
    context.response.envelope = withThread(envelope, replyThread(envelope.message))
  })
}
