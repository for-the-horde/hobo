# Description:
#   Replies with clever images for "for the comments"
#
# Dependencies:
#   None
#
# Configuration:
#   None
#
# Commands:
#   for the comments - Get an image
#
# Author:
#   whoisjake

images = [
    "https://i.imgur.com/jLZz4Na.gif",
    "http://cdn.meme.am/instances/500x/49031601.jpg",
    "http://sd.keepcalm-o-matic.co.uk/i/keep-calm-i-m-just-here-to-read-the-comments.png",
    "http://memecrunch.com/meme/3AVAJ/just-came-to-read-the-comments-bill-hader-popcorn/image.png?w=500&c=1",
    "https://s-media-cache-ak0.pinimg.com/736x/21/50/95/2150958765b27acf8c706cc6d9760399.jpg"
  ]

module.exports = (robot) ->
  robot.hear /\b(for|read)\sthe\scomments\b/i, (msg) ->
    msg.send msg.random images
