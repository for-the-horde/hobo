# Description:
#   Translates a sentence into emoji.
#   Heavily based on: https://github.com/muan/emojilib
#                     https://github.com/notwaldorf/emoji-translate
#
# Dependencies:
#   emojilib
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
    sentence = []
    for word in words
      sentence.push(findAnEmojiFor(word))
    console.log(sentence)
    msg.send sentence.join(" ")

findAnEmojiFor = (keyword) ->
  keyword = keyword.trim().toLowerCase()
  if !keyword or keyword == '' or keyword == 'it'
    return keyword
  maybeSingular = ''
  if keyword.length > 2 and keyword[keyword.length - 1] == 's'
    maybeSingular = keyword.slice(0, keyword.length - 1)
  maybePlural = if keyword.length == 1 then '' else keyword + 's'
  for emoji of emojis
    keywords = emojis[emoji].keywords
    if emoji == keyword or emoji == maybeSingular or emoji == maybePlural or keywords and keywords.indexOf(keyword) >= 0 or keywords and keywords.indexOf(maybeSingular) >= 0 or keywords and keywords.indexOf(maybePlural) >= 0
      return emojis[emoji].char
  keyword
