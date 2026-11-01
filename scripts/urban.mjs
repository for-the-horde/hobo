// Description:
//   Define terms via Urban Dictionary
//
// Commands:
//   hubot what is <term>?         - Searches Urban Dictionary and returns definition
//   hubot urban me <term>         - Searches Urban Dictionary and returns definition
//   hubot urban define me <term>  - Searches Urban Dictionary and returns definition
//   hubot urban example me <term> - Searches Urban Dictionary and returns example
//
// Author:
//   Travis Jeffery (@travisjeffery), Robbie Trencheny (@Robbie)
//
// Contributors:
//   Benjamin Eidelman (@beneidel)

export async function urbanDict (query, fetchImpl = fetch) {
  const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(query)}`
  const response = await fetchImpl(url, { signal: AbortSignal.timeout(10_000) })
  if (!response.ok) throw new Error(`Urban Dictionary returned HTTP ${response.status}`)
  const body = await response.json()
  return body?.list?.[0] ?? null
}

export default (robot) => {
  const lookup = async (res, term, field, notFound) => {
    let entry
    try {
      entry = await urbanDict(term)
    } catch (err) {
      robot.logger.error(`urban: ${err.message}`)
      await res.send("Urban Dictionary isn't answering right now.")
      return
    }
    if (!entry) {
      await res.send(notFound)
      return
    }
    await res.send(`*${entry.word}:* ${entry[field]}`)
  }

  robot.respond(/what ?is ([^?]*)[?]*/i, async (res) => {
    await lookup(res, res.match[1], 'definition', `I don't know what "${res.match[1]}" is`)
  })

  robot.respond(/(urban)( define)?( example)?( me)? (.*)/i, async (res) => {
    const field = res.match[3] ? 'example' : 'definition'
    await lookup(res, res.match[5], field, `"${res.match[5]}" not found`)
  })
}
