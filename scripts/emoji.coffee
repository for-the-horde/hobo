# Description:
#   Translates a sentence into emoji.
#
# Dependencies:
#
#
# Configuration:
#   None
#
# Commands:
#   hubot emoji <sentence>  - Translates a sentence.
#
# Author:
#   Jake Good (@whoisjake)
#
emojis = require("emojilib")

module.exports = (robot) ->
  robot.respond /(emoji)\s(.*)/i, (msg) ->
    words = msg.match[2].split(' ')
    sentence = ""
    for word in words
      sentence += findAnEmojiFor(word)
    msg.send sentence

findAnEmojiFor = (keyword) ->
  keyword = keyword.trim().toLowerCase()
  if !keyword or keyword == '' or keyword == 'it'
    return keyword
  # Maybe this is a plural word but the keyword is the singular?
  # Don't do it for two letter words since "as" would become "a" etc.
  maybeSingular = ''
  if keyword.length > 2 and keyword[keyword.length - 1] == 's'
    maybeSingular = keyword.slice(0, keyword.length - 1)
  # Maybe this is a singular word but the keyword is the plural?
  # Don't do this for single letter since that will pluralize crazy things.
  maybePlural = if keyword.length == 1 then '' else keyword + 's'
  # Go through all the things and find the first one that matches.
  for emoji of emojis
    keywords = emojis[emoji].keywords
    if emoji == keyword or emoji == maybeSingular or emoji == maybePlural or keywords and keywords.indexOf(keyword) >= 0 or keywords and keywords.indexOf(maybeSingular) >= 0 or keywords and keywords.indexOf(maybePlural) >= 0
      return emojis[emoji].char
  keyword
