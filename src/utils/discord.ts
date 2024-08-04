import { Client, GuildMember, PermissionFlagsBits } from 'discord.js';
import axios from 'axios';
import { Context } from 'hono';

export async function fetchGuild(client: Client, guildId: string) {
    return (
        client.guilds.cache.get(guildId) ||
        (await client.guilds.fetch(guildId).catch(() => null))
    );
}

export async function authenticate(c: Context) {
    const serverId = new URL(c.req.url).searchParams.get('serverId');
    const token = c.req.header('Authorization');
    if (!token || !serverId) return false;
    const member = await axios
        .get<GuildMember>(
            `https://discord.com/api/v10/users/@me/guilds/${serverId}/member`,
            {
                headers: {
                    Authorization: token,
                },
            },
        )
        .catch(() => null);
    if (!member || member.status !== 200) return false;
    if (member.data.user.bot) return false;
    if (!(member.data.permissions.bitfield & PermissionFlagsBits.ManageGuild))
        return false;
    return serverId;
}
