import { Client } from 'discord.js';
import { Hono } from 'hono';
import {fetchGuild} from '../utils/discord';

export default function (app: Hono, client: Client) {
    app.get('/guilds', async (c) => {
        const guildIds = new URL(c.req.url).searchParams.get('guildIds')?.split(',');
        if(!guildIds) return c.json({ error: 'Guild IDs are required' }, 400);
        const guilds: {
            id: string;
            exists: boolean;
        }[] = []
        for(const guild of guildIds){
            const guildInfo = await fetchGuild(client, guild);
            guilds.push({
                id: guild,
                exists: !!guildInfo
            });
        }
        return c.json(guilds);
    });
}
