# Description:
#   A hubot script that tells the story of hobo
#
# Commands:
#   hubot origin story - Tells the story of hobo

module.exports = (robot) ->

  ORIGIN_STORY = """
Born on Tuesday, Feb 3, 2015 to single parent @justin, I came into this world already knowing how to share excellent gifs and weather results with remarkable precision. As I matured under the tutelage of @whoisjake, I began to shoulder more responsibility within the Horde. Welcoming new members and sharing the Code of Conduct became part of my normal daily activities.

In a tragic slack-adapter-related accident, I slipped into a comatose state for a number of months. Little is known about my existence during this period.

I use they/them pronouns, and am a champion for diversity & inclusion in both the robot and human communities. Despite being confined to a single slack instance, I have _many_ friends -- 111 of whom I consider active. My favorite food is raisins, and I pride myself on being a life-long learner.

story by @experimatt
    """

  robot.respond /origin story/i, (msg) ->
    msg.send ORIGIN_STORY
