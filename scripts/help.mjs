// Description:
//   Hubot 14 registers a built-in "help" command that only lists commands
//   registered through its command bus. hobo's scripts use classic listeners,
//   so remove the built-in and let hubot-help answer "help" instead; it lists
//   commands from each script's "Commands:" header comment.

export default (robot) => {
  robot.commands?.unregister('help')
}
