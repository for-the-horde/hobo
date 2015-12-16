# Description:
#   A hubot script that helps a chat community present and enforce a Code of Conduct.
#
# Configuration
#   HUBOT_CODE_OF_CONDUCT_FILE - Path to a plaintext
#   HUBOT_CODE_OF_CONDUCT_WELCOME_MESSAGE - A welcome message that is DM'd to the user upon joining the channel.
#   HUBOT_CODE_OF_CONDUCT_JOIN_CHANNEL - The channel to listen to for join messages. Default: Shell
#
# Commands:
#   hubot code of conduct - Hubot will reply with the current code of conduct content and the optional contributing url.
fs = require('fs')

module.exports = (robot) ->
  HUBOT_CODE_OF_CONDUCT_FILE = process.env.HUBOT_CODE_OF_CONDUCT_FILE or "code_of_conduct.md"
  HUBOT_CODE_OF_CONDUCT_WELCOME_MESSAGE = process.env.HUBOT_CODE_OF_CONDUCT_WELCOME_MESSAGE or "Welcome to For the Horde! Here's our code of conduct. Also, hop over to <#introductions> and tell us about yourself."
  HUBOT_CODE_OF_CONDUCT_JOIN_CHANNEL = process.env.HUBOT_CODE_OF_CONDUCT_JOIN_CHANNEL or 'general'

  if _.isUndefined(HUBOT_CODE_OF_CONDUCT_FILE) || _.isNull(HUBOT_CODE_OF_CONDUCT_FILE)
    robot.logger.error "The environment variable HUBOT_CODE_OF_CONDUCT_FILE is undefined."
    codeOfConduct = "I'm sorry, but one does not exist. Please ask my keeper to set the environment variable HUBOT_CODE_OF_CONDUCT_FILE with a path to a file containing your code of conduct. Thanks!"
  else
    reloadFile HUBOT_CODE_OF_CONDUCT_FILE, (err, contents) ->
      return robot.logger.error err if err
      codeOfConduct = contents

  robot.enter (msg) ->
    if msg.message.room is HUBOT_CODE_OF_CONDUCT_JOIN_CHANNEL
      robot.send room: msg.message.user.name, HUBOT_CODE_OF_CONDUCT_WELCOME_MESSAGE
      robot.send room: msg.message.user.name, codeOfConduct
      msg.finish

  robot.respond /reload code of conduct/i, (msg) ->
    reloadFile HUBOT_CODE_OF_CONDUCT_FILE, (err, contents) ->
      return robot.logger.error err if err
      codeOfConduct = contents
      msg.reply "Done!"

  robot.respond /code of conduct/i, (msg) ->
    msg.send codeOfConduct

reloadFile = (filePath,callback) ->
  fs.realpath filePath, (err, resolvedPath) ->
    callback err if err
    fs.readFile resolvedPath, "utf8", (err, data) ->
      callback err if err
      callback null, data
