// Description:
//   Shut down cleanly on SIGTERM/SIGINT (e.g. `docker compose stop`) so the
//   brain is saved before exit. Hubot 14 doesn't handle these signals itself.
//
//   Saving is skipped until hubot-redis-brain has loaded the stored brain
//   (it turns autosave back on at that point); saving earlier would
//   overwrite the real brain in Redis with an empty one.

const FLUSH_MS = 1000

export default (robot) => {
  let brainLoaded = false
  robot.brain.on('connected', () => { brainLoaded = true })

  let stopping = false
  const stop = (signal) => {
    if (stopping) return
    stopping = true
    robot.logger.info(`Received ${signal}, shutting down`)
    if (!brainLoaded) {
      // robot.shutdown() always saves the brain, so skip it entirely.
      robot.logger.warn('Brain not loaded yet; exiting without saving')
      process.exit(0)
    }
    robot.shutdown()
    // Give the Redis client a moment to flush the final SET.
    setTimeout(() => process.exit(0), FLUSH_MS).unref()
  }

  process.once('SIGTERM', () => stop('SIGTERM'))
  process.once('SIGINT', () => stop('SIGINT'))
}
