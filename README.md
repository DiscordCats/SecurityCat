# SecurityCat

This is the public repository for the "Security Cat" Discord bot, made by [Jay](https://github.com/JayXTQ) and [rad](https://github.com/radnotred).

This bot is a Discord bot that uses the built-in Automod features of Discord to help moderate your server from scams, discord invites, and commonly used brainrot words to even save yours and your members braincells!

You can invite Security Cat by [clicking the invite link here!](https://discord.com/oauth2/authorize?client_id=1268289518868627528)
## Setup

1. Clone the repository
2. Run `npm install`
3. Rename `.env.example` to `.env` and fill in the values.
4. Run `npm run build` to build the bot.
5. Run `npm start` to start the bot, if you want the bot to restart on every change, you can do `npm run start:watch`.

## Features
Automatic creation of preset rules that the bot will use to set automod rules for your server, you can also create your own rules (not yet) and have them managed through the bot as well.
We also have a built-in reporting system for incorrect detections, you can report a detection and we will look into it (also not yet :p)

## Dependencies

- [@hono/node-server](https://www.npmjs.com/package/@hono/node-server) - A Node.js server adapter for the Hono framework. Version: ^1.12.0
- [discord.js](https://www.npmjs.com/package/discord.js) - A powerful JavaScript library for interacting with the Discord API. Version: ^14.14.1
- [dotenv](https://www.npmjs.com/package/dotenv) - A module that loads environment variables from a `.env` file into `process.env`. Version: ^16.4.5
- [drizzle-orm](https://www.npmjs.com/package/drizzle-orm) - A TypeScript ORM for SQL databases. Version: ^0.32.1
- [hono](https://www.npmjs.com/package/hono) - A web framework for building APIs and web applications. Version: ^4.5.3
- [pg](https://www.npmjs.com/package/pg) - PostgreSQL client for Node.js. Version: ^8.12.0

## Dev Dependencies

- [@types/pg](https://www.npmjs.com/package/@types/pg) - TypeScript definitions for pg. Version: ^8.11.6
- [drizzle-kit](https://www.npmjs.com/package/drizzle-kit) - A toolkit for working with Drizzle ORM. Version: ^0.23.1
- [tsx](https://www.npmjs.com/package/tsx) - TypeScript JSX transpiler. Version: ^4.7.1
- [typescript](https://www.npmjs.com/package/typescript) - TypeScript language and compiler. Version: ^5.4.3

---

## Database
Once you setup your **Postgres** based database, you will need to input your connection URI, depending on your host, this may be given to you, or you will need to manually acquire it. Your connection URI will always look like this: `postgresql://username:password@host:port/database`. You can then run the following command to create the tables required for the bot to function properly.
`npx drizzle-kit push`