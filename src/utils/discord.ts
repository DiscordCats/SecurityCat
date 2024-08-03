import { Client } from 'discord.js';

export async function fetchGuild(client: Client, guildId: string) {
    return (
        client.guilds.cache.get(guildId) ||
        (await client.guilds.fetch(guildId).catch(() => null))
    );
}
