import { Client, PermissionFlagsBits } from 'discord.js';
import axios from 'axios';
import { Context } from 'hono';
import { client } from '../index';

export async function fetchGuild(client: Client, guildId: string) {
    return (
        client.guilds.cache.get(guildId) ||
        (await client.guilds.fetch(guildId).catch(() => null))
    );
}

export async function fetchGuildMember(
    client: Client,
    guildId: string,
    userId: string,
) {
    const guild = await fetchGuild(client, guildId);
    if (!guild) return null;
    return (
        guild.members.cache.get(userId) ||
        (await guild.members.fetch(userId).catch(() => null))
    );
}

export async function authenticate(c: Context) {
    const serverId = new URL(c.req.url).searchParams.get('serverId');
    const token = c.req.header('Authorization');

    if (!token || !serverId) {
        console.log('Missing token or serverId');
        return false;
    }

    try {
        const memberResponse = await axios.get(
            `https://discord.com/api/v10/users/@me/guilds/${serverId}/member`,
            {
                headers: {
                    Authorization: token,
                },
            },
        );

        if (memberResponse.status !== 200) {
            console.log('Non-200 response status:', memberResponse.status);
            return false;
        }

        const member = memberResponse.data;
        if (member.user.bot) {
            console.log('User is a bot:', member.user);
            return false;
        }

        const guildMember = await fetchGuildMember(
            client,
            serverId,
            member.user.id,
        );
        let hasManageGuildPermission =
            guildMember?.permissions.has(PermissionFlagsBits.ManageGuild) ||
            false;

        if (!hasManageGuildPermission) {
            console.log('Insufficient permissions for ManageGuild');
            return false;
        }

        return serverId;
    } catch (error) {
        console.error('Error during authentication:', error);
        return false;
    }
}
