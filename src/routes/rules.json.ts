import { Client } from 'discord.js';
import { Hono } from 'hono'
import { readFileSync } from 'fs';

export default function (app: Hono, client: Client) {
    app.get('/rules.json', async (c) => {
        c.json(JSON.parse(readFileSync('./rules.json', 'utf-8')));
    });
}
