// Description:
//   When things aren't going well, you must flip it. (╯°□°）╯︵ ʇoqnɥ
//   Ported from hubot-flip 2.17.1.
//
// Commands:
//   hubot flip <text> - express your anger
//   hubot rage flip <text> - express your anger with rage
//   hubot unflip <text>
//
// Authors:
//   jergason, addisonj, spajus, coryallegory

import flip from 'flip'

export default (robot) => {
  robot.respond(/(rage )?flip( .*)?$/i, async (res) => {
    const guy = res.match[1] ? '(ノಠ益ಠ)ノ彡' : '(╯°□°）╯︵'
    let toFlip = (res.match[2] || '').trim()
    if (toFlip === 'me') toFlip = res.message.user.name
    const flipped = toFlip === '' ? '┻━┻' : flip(toFlip)
    await res.send(`${guy} ${flipped}`)
  })

  robot.respond(/unflip( .*)?$/i, async (res) => {
    const toUnflip = (res.match[1] || '').trim()
    let unflipped = toUnflip
    if (toUnflip === 'me') unflipped = res.message.user.name
    else if (toUnflip === '') unflipped = '┬──┬'
    await res.send(`${unflipped} ノ( º _ ºノ)`)
  })
}
