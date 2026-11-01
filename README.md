`hobo` is For the Horde's friendly neighborhood slack chatbot. It was built on the [Hubot](http://hubot.github.com) framework and runs on Hubot 14 with the [`@hubot-friends/hubot-slack`](https://github.com/hubot-friends/hubot-slack) adapter (Slack Socket Mode).

# About hobo
Born on Tuesday, Feb 3, 2015 to single parent [Justin Cardinal](https://github.com/jcardinal), `hobo` came into this world already knowing how to share excellent gifs and weather results with remarkable precision. As they matured under the tutelage of [Jake Good](https://github.com/whoisjake), they began to shoulder more responsibility within the Horde. Welcoming new members and sharing the [Code of Conduct](code_of_conduct_readable.md) became part of their normal daily activities.

In a tragic slack-adapter-related accident, `hobo` slipped into a comatose state for a number of months. Little is known about hobo during this period.

`hobo` uses they/them pronouns, and is a champion for diversity & inclusion in both the robot and human communities. Despite being confined to a single slack instance, `hobo` has many friends -- 111 of whom they consider _active_. Their favorite food is raisins, and they pride themselves on being a life-long learner. See [Teaching hobo](#contributing) to learn how you can contribute to `hobo's` ongoing education.

# Running hobo locally

You need [Docker](https://docs.docker.com/get-docker/). Talk to hobo in your terminal with the Shell adapter (no Slack needed):

```
docker compose run --rm hobo npm run shell
```

This also starts a local Redis for hobo's brain. Type `hobo help` to see everything hobo knows.

Without Docker: install Node 24 and Redis, then `npm ci`, `redis-server &`, and `npm run shell`.

## Testing hobo

```
npm test                                  # or: docker compose run --rm hobo node --test
```

Tests live in `tests/` and use a fake chat adapter, so they don't need Slack or Redis. CI runs them on every pull request and builds the Docker image on amd64 and arm64.

# Deploying hobo

hobo runs on a small EC2 instance (arm64) with Docker and the Compose plugin. Nothing listens for inbound connections: Socket Mode connects out to Slack.

1. **Slack app.** Create it from `slack-app-manifest.yaml`, or apply that manifest to the existing app. Install it to the workspace, then create an app-level token with the `connections:write` scope. Then `/invite @hobo` to each channel hobo should hear; a new app doesn't inherit the old bot's channels. hobo is started with `--alias hobo`, so "hobo ..." works even if Slack gives the bot user a different handle.
2. **Config.** On the host, clone this repo, copy `.env.example` to `.env`, and fill in `HUBOT_SLACK_APP_TOKEN` and `HUBOT_SLACK_BOT_TOKEN`.
3. **Restore the brain (first deploy only).** Start Redis alone, load the brain, and check it **before** hobo starts. If hobo starts first, it creates an empty brain and saves it. Keep `hobo-brain.json` outside the repo directory so it can't end up in an image or a commit; it holds every member's Slack profile.
   ```
   docker compose up -d redis
   docker compose exec -T redis redis-cli -x SET hubot:storage < ~/hobo-brain.json
   docker compose exec -T redis redis-cli --raw GET hubot:storage | jq '{users: (.users | length), scores: (.plusPlus.scores | length)}'
   ```
   The last command needs `jq` (`sudo apt install jq`) and should print the user and karma counts you expect (918 and 559 for the 2022 brain). Delete `~/hobo-brain.json` once hobo is running; the nightly backups take over from there.

   `~/hobo-brain.json` is only hobo's `hubot:storage` key, pulled out of the old Redis dump so other bots' keys sharing that dump don't come along. To extract it (on any machine with Docker):
   ```
   mkdir -p /tmp/hobo-rdb && cp <old-dump>.rdb /tmp/hobo-rdb/dump.rdb
   docker run -d --rm --name hobo-rdb -v /tmp/hobo-rdb:/data redis:8-alpine redis-server --save '' --appendonly no
   sleep 2
   docker exec hobo-rdb redis-cli --raw GET hubot:storage > ~/hobo-brain.json
   docker stop hobo-rdb && rm -rf /tmp/hobo-rdb
   ```
4. **Start.** `docker compose up -d --build`, then `docker compose logs -f hobo`.

**Upgrades:** `git pull && docker compose up -d --build`. Dependabot opens PRs for npm packages, the Node and Redis images, and GitHub Actions.

**Backups:** `bin/backup-brain.sh` writes a gzipped copy of the brain to `backups/`, keeps the newest 30, and logs to `backups/backup.log`. If `HOBO_BACKUP_S3_URI` is set, it also copies each backup to S3. Run it nightly from cron; the script's header has an example line.

# Dropped in the Hubot 14 port

google-images (image me / animate me), maps, youtube, pugme, translate, applause (slow clap), the "for the comments" images, shipit, hubot-scripts, and the welcome DM for new members.

# Contributing
It's easy to contribute to hobo's capabilities! Whether you want to write a new script or just change some wording, all pull requests are welcome.

## Scripts
Please see the `/scripts` folder for examples of custom scripts we're using, and the [Hubot scripting docs](https://hubotio.github.io/hubot/docs/scripting.html) for more detailed documentation on how they work.

## Contributors
Thank you to everyone who's contributed to hobo!

* [Justin Cardinal](https://github.com/jcardinal)
* [Jake Good](https://github.com/whoisjake)
* [Ian Fitzpatrick](https://github.com/ianfitzpatrick)
* [Matt Decuir](https://github.com/experimatt)
