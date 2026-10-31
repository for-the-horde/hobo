// Description:
//   Tells the story of For the Horde
//
// Commands:
//   hubot lore - Tells the story of For the Horde

const FTH_LORE = "A long time ago… there were a collection of people trying to make their way through life… while drinking beers and meeting new people at a popular coworking space.\n\nThis social extravaganza was not officially endorsed by said coworking space, at least in enough of a capacity to provide the libations.\n\nTo ensure that nobody shall drink alone or not be alone without a drink…@robert obtained a square card reader to start collecting money to bring in beers.\n\nOver time, money came in, money came out, beers were drank… and many new friendships formed.\n\nThe need to label ourselves as something more… than just a group of people having a good time, became important…\n\nA co-operative was formed, legally through the United States Internal Revenue Service, Federal Bureau of Labour, and various other committees like the United States Senate Appropriations Subcommittee on Labor, Health and Human Services, Education, and Related Agencies.\n\nThe co-op needed a name.\n\nOn that day of reckoning… a joke was made that our co-op should be named “For the Horde”… a colloquial phrase where one sacrifices themselves for the group in order to move the group to better days (and more beer).\n\nBut it stuck.\n\nOne would think this story is over, but alas… a few of us were collecting online in an Internet Relay Chat to discuss Horde things…\n\nOver the next year, the horde saw membership in the IRC channel grow from two to ten and back to four…\n\nWhen startup valuations were drooping and there was a dire need for more unicorns… people started flocking towards the beautifully designed new kid on the block, SlackHQ.\n\nTesting the waters, a few members of the IRC channel dipped their toes… much to the grumblings of @robert and his leadership.\n\nDay after day, more and more *people* from the Twin Cities area, with the common goal of rising above… were invited into the Horde…\n\nForever changed, forever better\n\nstory by @whoisjake, FtH Historian"

export default (robot) => {
  robot.respond(/lore/i, async (res) => {
    await res.send(FTH_LORE)
  })
}
