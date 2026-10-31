# syntax=docker/dockerfile:1
FROM node:24-slim

LABEL org.opencontainers.image.source="https://github.com/for-the-horde/hobo"

ENV NODE_ENV=production
WORKDIR /app
# The Shell adapter (local testing) writes .hubot_history to the working directory.
RUN chown node:node /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY . .

USER node
CMD ["node_modules/.bin/hubot", "--adapter", "@hubot-friends/hubot-slack", "--name", "hobo"]
