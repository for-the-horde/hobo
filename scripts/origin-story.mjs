// Description:
//   Tells the story of hobo
//
// Commands:
//   hubot origin story - Tells the story of hobo

const ORIGIN_STORY = "Born on Tuesday, Feb 3, 2015 to single parent @justin, I came into this world already knowing how to share excellent gifs and weather results with remarkable precision. As I matured under the tutelage of @whoisjake, I began to shoulder more responsibility within the Horde. Welcoming new members and sharing the Code of Conduct became part of my normal daily activities.\n\nIn a tragic slack-adapter-related accident, I slipped into a comatose state for a number of months. Little is known about my existence during this period.\n\nI use they/them pronouns, and am a champion for diversity & inclusion in both the robot and human communities. Despite being confined to a single slack instance, I have _many_ friends -- 111 of whom I consider active. My favorite food is raisins, and I pride myself on being a life-long learner.\n\nstory by @experimatt"

export default (robot) => {
  robot.respond(/origin story/i, async (res) => {
    await res.send(ORIGIN_STORY)
  })
}
