import { Client } from 'discord.js';
import { Hono } from 'hono';
import { authenticate } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

export default function (app: Hono, client: Client) {
    app.get('/modules', async (c) => {
        const auth = await authenticate(c);
        if (!auth) return c.json({ error: 'Unauthorized' }, 401);
        const modules = await db
            .select({ modules: servers.modules })
            .from(servers)
            .where(eq(servers.id, auth))
            .execute();
        return c.json(modules[0]?.modules || []);
    });
}
