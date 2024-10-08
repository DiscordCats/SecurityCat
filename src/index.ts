import { readdirSync } from 'fs';
import { Client, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';
import { Command } from './types/discord';
import { Hono } from 'hono';
import { serve } from '@hono/node-server';

dotenv.config();

if (!process.env.TOKEN) throw Error('You need to provide a token');

export const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMessages,
    ],
});

export const commands = new Map<string, Command>();

const eventFolders = readdirSync('./src/events');
for (const folder of eventFolders) {
    switch (folder) {
        case 'discord': {
            readdirSync(`./src/events/${folder}`).forEach((file) => {
                import(`./events/${folder}/${file}`).then((event) => {
                    event.default(client);
                });
            });
            break;
        }
        default: {
            readdirSync(`.src/events/${folder}`).forEach((file) => {
                import(`./events/${folder}/${file}`).then((event) => {
                    event.default();
                });
            });
            break;
        }
    }
}

client.on('error', (err) => {
    console.log(err.message);
});

client.login(process.env.TOKEN);

const app = new Hono();

app.get('/', (c) => {
    return c.text('Hello World!');
});

// unnecessary for functioning webserver

// app.all('*', async (c, next) => {
//     console.log('New web request');
//     console.log(c.req.method, c.req.url, await c.req.json());
//     await next();
// });

const routeFiles = readdirSync('./src/routes');
for (const file of routeFiles) {
    import(`./routes/${file}`).then((route) => {
        route.default(app, client);
    });
}

const port = +(process.env.PORT || '3000');

serve({
    fetch: app.fetch,
    port,
});

console.log(`Server running on http://localhost:${port}`);
