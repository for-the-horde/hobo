// Description:
//   Applause from Orson Welles and others. Ported from hubot-applause 1.0.0.
//
// Commands:
//   hubot applause|applaud|bravo|slow clap - Get applause
//   hubot sarcastic applause|clap - Get sarcastic applause
//
// Author:
//   joshfrench, rjanardhana (ported to hubot-script package)

export const images = {
  sincere: [
    "https://i.imgur.com/pfrtv6H.gif",
    "https://i.imgur.com/Bp4P8l3.gif",
    "https://i.imgur.com/v7mZ22P.gif",
    "https://i.imgur.com/S1v4KuY.gif",
    "https://i.imgur.com/YTaSAkq.gif",
    "https://i.imgur.com/JO6Wz3r.gif",
    "https://i.imgur.com/pWEd6cF.gif",
    "https://i.imgur.com/zumSlIA.gif",
    "https://i.imgur.com/RGczKmV.gif",
    "https://i.imgur.com/KAQhoCm.gif",
    "https://i.imgur.com/PASRKXo.gif",
    "https://i.imgur.com/ZOWQTO6.gif",
    "https://i.imgur.com/cY0eH5c.gif",
    "https://i.imgur.com/wf5qvOM.gif",
    "https://i.imgur.com/9Zv4V.gif",
    "https://i.imgur.com/t8zvc.gif",
    "http://cache.blippitt.com/wp-content/uploads/2012/06/Daily-Life-GIFs-06-The-Rock-Clapping.gif",
    "http://25.media.tumblr.com/tumblr_m00e9mCyWj1rqtbn0o1_500.gif",
    "http://assets0.ordienetworks.com/images/GifGuide/clapping/Kurtclapping.gif",
    "http://assets0.ordienetworks.com/images/GifGuide/clapping/riker.gif",
    "http://assets0.ordienetworks.com/images/GifGuide/clapping/hp3.gif",
    "http://assets0.ordienetworks.com/images/GifGuide/clapping/1292223254212-dumpfm-mario-Obamaclap.gif",
    "http://www.reactiongifs.com/wp-content/uploads/2013/01/applause.gif"
  ],
  insincere: [
    "https://i.imgur.com/2QXgcqP.gif",
    "https://i.imgur.com/Yih2Lcg.gif",
    "https://i.imgur.com/un3MuET.gif",
    "https://i.imgur.com/H2wPc1d.gif",
    "https://i.imgur.com/uOtALBE.gif",
    "https://i.imgur.com/nmqrdiF.gif",
    "https://i.imgur.com/GgxOUGt.gif",
    "https://i.imgur.com/wyTQMD6.gif",
    "https://i.imgur.com/GYRGOy6.gif",
    "https://i.imgur.com/ojIsLUA.gif",
    "https://i.imgur.com/bRetADl.gif",
    "https://i.imgur.com/814mkEC.gif",
    "https://i.imgur.com/uYryMyr.gif",
    "https://i.imgur.com/YfrikPR.gif",
    "https://i.imgur.com/sBEFqYR.gif",
    "https://i.imgur.com/Sx8iAS8.gif",
    "https://i.imgur.com/5zKXz.gif"
  ]
};

export default (robot) => {
  robot.respond(/applau(d|se)|bravo|sarcastic applause|(slow|sarcastic) clap/i, async (res) => {
    const type = /sarcastic/i.test(res.message.text) ? images.insincere : images.sincere
    await res.send(res.random(type))
  })
}
