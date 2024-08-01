import {
    ApplicationCommandOptionType,
    ChatInputCommandInteraction,
    GuildTextBasedChannel,
    ChannelType,
    AutoModerationActionType
} from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';
import { eq } from 'drizzle-orm';

export default {
    name: 'logchannel',
    description: 'Manage the auto-moderation log channel',
    options: [
        {
            name: 'set',
            description: 'Set the log channel for auto-moderation actions',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The channel to set for auto-moderation logs',
                    required: true,
                    channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                }
            ],
        },
        {
            name: 'edit',
            description: 'Edit the auto-moderation log channel',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'new_channel',
                    description: 'The new channel to set for auto-moderation logs',
                    required: true,
                    channelTypes: [ChannelType.GuildText, ChannelType.GuildAnnouncement]
                }
            ],
        },
    ],
    role: 'CHAT_INPUT',
    run: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const serverId = interaction.guild?.id;

        if (!serverId) {
            return interaction.reply({ content: 'Unable to determine server ID.', ephemeral: true });
        }

        let serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then(res => res[0]);

        if (subcommand === 'set') {
            const channel = interaction.options.getChannel('channel') as GuildTextBasedChannel;

            if (!channel) {
                return interaction.reply({ content: 'Invalid channel specified.', ephemeral: true });
            }

            if (!serverRecord) {
                await db.insert(servers)
                    .values({
                        id: serverId,
                        automod_channel: channel.id,
                        modules: [],
                        automod_ids: [],
                        extras: null
                    })
                    .execute();
            } else {
                await db.update(servers)
                    .set({ automod_channel: channel.id })
                    .where(eq(servers.id, serverId))
                    .execute();
            }

            const autoModManager = interaction.guild?.autoModerationRules;
            if (autoModManager && serverRecord?.automod_ids) {
                for (const ruleId of serverRecord.automod_ids) {
                    try {
                        const rule = await autoModManager.fetch(ruleId);
                        const existingActions = rule.actions;

                        const newActions = existingActions.map(action => {
                            if (action.type === AutoModerationActionType.SendAlertMessage) {
                                return {
                                    ...action,
                                    metadata: { channel: channel.id }
                                };
                            }
                            return action;
                        });

                        await rule.edit({
                            actions: newActions
                        });
                    } catch (err) {
                        console.error(`Error updating rule ${ruleId}:`, err);
                    }
                }
            }

            return interaction.reply(`Auto-moderation log channel set to ${channel.name}.`);
        } else if (subcommand === 'edit') {
            if (!serverRecord) {
                return interaction.reply({ content: 'No server record found. Please set a log channel first.', ephemeral: true });
            }

            const newChannel = interaction.options.getChannel('new_channel') as GuildTextBasedChannel;

            if (!newChannel) {
                return interaction.reply({ content: 'Invalid channel specified.', ephemeral: true });
            }

            await db.update(servers)
                .set({ automod_channel: newChannel.id })
                .where(eq(servers.id, serverId))
                .execute();

            const autoModManager = interaction.guild?.autoModerationRules;
            if (autoModManager && serverRecord?.automod_ids) {
                for (const ruleId of serverRecord.automod_ids) {
                    try {
                        const rule = await autoModManager.fetch(ruleId);
                        const existingActions = rule.actions;

                        const newActions = existingActions.map(action => {
                            if (action.type === AutoModerationActionType.SendAlertMessage) {
                                return {
                                    ...action,
                                    metadata: { channel: newChannel.id }
                                };
                            }
                            return action;
                        });

                        await rule.edit({
                            actions: newActions
                        });
                    } catch (err) {
                        console.error(`Error updating rule ${ruleId}:`, err);
                    }
                }
            }

            return interaction.reply(`Auto-moderation log channel updated to ${newChannel.name}.`);
        }
    }
} satisfies Command;
