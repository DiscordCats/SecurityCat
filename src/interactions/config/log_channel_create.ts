import {
    ButtonInteraction,
    CategoryChannel,
    ChannelType,
    GuildTextBasedChannel,
} from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';

export default {
    custom_id: 'create_log_channel',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const guild = interaction.guild;
        if (!guild) {
            return interaction.reply({
                content: 'This action can only be performed in a server.',
                ephemeral: true,
            });
        }

        const serverId = guild.id;

        const category = (await guild.channels.create({
            name: 'logging',
            type: ChannelType.GuildCategory,
            position: guild.channels.cache.size,
        })) as CategoryChannel;

        const logChannel = (await guild.channels.create({
            name: 'automod-logs',
            type: ChannelType.GuildText,
            parent: category.id,
        })) as GuildTextBasedChannel;

        await db
            .insert(servers)
            .values({
                id: serverId,
                modules: [],
                automod_ids: [],
                automod_channel: logChannel.id,
                extras: null,
            })
            .onConflictDoUpdate({
                target: servers.id,
                set: {
                    automod_channel: logChannel.id,
                },
            })
            .execute();

        await interaction.reply({
            content: `Created log channel ${logChannel.name} in category ${category.name} and set it as the auto-moderation log channel.`,
            ephemeral: true,
        });
    },
} satisfies Command;
