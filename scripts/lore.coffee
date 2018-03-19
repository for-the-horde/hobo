# Description:
#   A hubot script that tells the story of FtH
#
# Commands:
#   hubot lore - Tells the story of For the Horde

module.exports = (robot) ->
  HUBOT_LORE = [
    "A long time ago… there were a collection of people trying to make their way through life… while drinking beers and meeting new people at a popular coworking space.",
    "This social extravaganza was not officially endorsed by said coworking space, at least in enough of a capacity to provide the libations.",
    "To ensure that nobody shall drink alone or not be alone without a drink… @robert obtained a square card reader to start collecting money to bring in beers.",
    "Over time, money came in, money came out, beers were drank… and many new friendships formed",
    "The need to label ourselves as something more… than just a group of people having a good time, became important…",
    "A co-operative was formed, legally through the United States Internal Revenue Service, Federal Bureau of Labour, and various other committees like the United States Senate Appropriations Subcommittee on Labor, Health and Human Services, Education, and Related Agencies",
    "The co-op needed a name",
    "and on that day of reckoning… a joke was made that our co-op should be named “For the Horde”… a colloquial phrase where one sacrifices themselves for the group in order to move the group to better days (and more beer)",
    "but it stuck",
    "One would think this story is over, but alas… a few of us were collecting online in an Internet Relay Chat to discuss Horde things…",
    "Over the next year, the horde saw membership in the IRC channel grow from two to ten and back to four…",
    "When startup valuations were drooping and there was a dire need for more unicorns… people started flocking towards the beautifully designed new kid on the block, SlackHQ",
    "Testing the waters, a few members of the IRC channel dipped their toes… much to the grumblings of @robert and his leadership",
    "Day after day, more and more ​*people*​ from the Twin Cities area, with the common goal of rising above… were invited into the Horde...",
    "Forever changed, forever better",
    "story by @whoisjake, FtH Historian"
    ]
  robot.respond /lore/i, (msg) ->
    msg.send line for line in HUBOT_LORE
