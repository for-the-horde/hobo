`hobo` is For the Horde's friendly neighborhood slack chatbot. It was built on the [Hubot](http://hubot.github.com) framework and bootstrapped using [generator-hubot](https://github.com/github/generator-hubot).

# About hobo
Born on Tuesday, Feb 3, 2015 to single parent [Justin Cardinal](https://github.com/jcardinal), `hobo` came into this world already knowing how to share excellent gifs and weather results with remarkable precision. As they matured under the tutelage of [Jake Good](https://github.com/whoisjake), they began to shoulder more responsibility within the Horde. Welcoming new members and sharing the [Code of Conduct](code_of_conduct_readable.md) became part of their normal daily activities.

In a tragic slack-adapter-related accident, `hobo` slipped into a comatose state for a number of months. Little is known about hobo during this period.

`hobo` uses they/them pronouns, and is a champion for diversity & inclusion in both the robot and human communities. Despite being confined to a single slack instance, `hobo` has many friends -- 111 of whom they consider _active_. Their favorite food is raisins, and they pride themselves on being a life-long learner. See [Teaching hobo](#contributing) to learn how you can contribute to `hobo's` ongoing education.

# Local setup
These instructions assume you're using [Homebrew](https://brew.sh/) on a Mac.

## Prerequisites

1. Node (`brew install node`)
2. Redis (`brew install redis`)

## Installation

1. Clone the repo
2. Set these environment variables if you want google images to work:
    * `HUBOT_GOOGLE_CSE_KEY` - Your Google developer API key
    * `HUBOT_GOOGLE_CSE_ID` - The ID of your Custom Search Engine

## Running hobo locally

1. Start redis (`brew services start redis`)
2. Run `bin/hubot`

On first run, hobo will install all relevant dependencies. Once it's up and running, you'll see an output that looks something like this:

```
$ bin/hubot
added 236 packages in 4.658s
hobo> [Sun Mar 18 2018 18:43:55 GMT-0500 (CDT)] INFO hubot-redis-brain: Using default redis on localhost:6379
[Sun Mar 18 2018 18:43:55 GMT-0500 (CDT)] INFO hubot-redis-brain: Data for hubot brain retrieved from Redis
```
If you don't initially see the `hobo>` prompt, just hit enter and it should appear. From there, you can interact with hobo as if you were chatting with them in Slack!

## Interacting with hobo
Here are a few commands we recommend. Use `hobo help` for the full list.

```
hobo code of conduct        # DMs the code of conduct
hobo lore                   # tells the story of For the Horde
hobo tell me a story        # tells a story in emoji
hobo <name>++ <reason>      # gives internet points to <name>
hobo <name>-- <reason>      # takes away internet points from <name>
hobo score <name>           # shows internet points for <name>
hobo image <query>          # returns the top google image result for <query>; requires environment variables to be set
hobo animate <query>        # returns the top gif result for <query>; requires environment variables to be set
```

## Testing hobo
We don't yet have an automated testing framework in place, so for now we manually test hobo.

## Troubleshooting

1. Make sure redis is running
2. If you get missing module errors, try deleting the `node_modules` directory and re-running `bin/hubot`

# Deploying hobo
`hobo` currently lives on a private server to which only Justin has access. Deploys are currently done manually.

# Contributing
It's easy to contribute to hobo's capabilities! Whether you want to write a new script or just change some wording, all pull requests are welcome.

## Scripts
Please see the `/scripts` folder for examples of custom scripts we're using, and [Slack Developer Kit for Hubot](http://slackapi.github.io/hubot-slack/basic_usage) for more detailed documentation on how they work.

## Contributors
Thank you to everyone who's contributed to hobo!

* [Justin Cardinal](https://github.com/jcardinal)
* [Jake Good](https://github.com/whoisjake)
* [Ian Fitzpatrick](https://github.com/ianfitzpatrick)
* [Matt Decuir](https://github.com/experimatt)
