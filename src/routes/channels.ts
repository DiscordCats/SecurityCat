import { Client } from 'discord.js';
import { Hono } from 'hono';
import { authenticate, fetchGuild } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

export default function (app: Hono, client: Client) {
    app.get('/channels', async (c) => {
        const auth = await authenticate(c);
        if (!auth) return c.json({ error: 'Unauthorized' }, 401);
        const guild = await fetchGuild(client, auth);
        if (!guild) return c.json({ error: 'Guild not found' }, 404);
        return c.json(
            guild.channels.cache.map((channel) => {
                return {
                    id: channel.id,
                    name: channel.name,
                    category: channel.parent?.name || null,
                };
            }),
        );
    });
}
