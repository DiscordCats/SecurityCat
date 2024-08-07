import { Command } from '../../types/discord';
import {
    ButtonInteraction,
    ChannelType,
    GuildTextBasedChannel,
    CategoryChannel,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    AutoModerationActionType,
    AutoModerationRuleEditOptions,
    AutoModerationActionMetadataOptions,
} from 'discord.js';
import { db } from '../../db';
import { servers } from '../../schema';
import { eq } from 'drizzle-orm';
import {
    createErrorEmbed,
    createSetupConfirmationEmbed,
    createTimeoutSetupEmbed,
} from '../../utils/embeds';

export default {
    custom_id: 'create-log-channel',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const guild = interaction.guild;
        if (!guild) {
            const errorEmbed = createErrorEmbed(
                'This action can only be performed in a server.',
            );
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const category = (await guild.channels.create({
            name: 'logging',
            type: ChannelType.GuildCategory,
        })) as CategoryChannel;

        const logChannel = (await guild.channels.create({
            name: 'automod-logs',
            type: ChannelType.GuildText,
            parent: category.id,
        })) as GuildTextBasedChannel;

        const serverId = guild.id;

        let serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        if (!serverRecord) {
            const errorEmbed = createErrorEmbed('Server record not found.');
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const updatedModules = serverRecord.modules.map((module) => ({
            ...module,
            log: logChannel.id,
        }));

        await db
            .update(servers)
            .set({ modules: updatedModules })
            .where(eq(servers.id, serverId))
            .execute();

        const autoModManager = guild.autoModerationRules;
        if (autoModManager) {
            for (const mod of updatedModules) {
                try {
                    if (!mod.id) continue;
                    const rule = await autoModManager.fetch(mod.id);
                    if (rule) {
                        const existingActions = rule.actions;

                        let actionUpdated = false;
                        const newActions = existingActions.map((action) => {
                            if (
                                action.type ===
                                AutoModerationActionType.SendAlertMessage
                            ) {
                                actionUpdated = true;
                                return {
                                    type: AutoModerationActionType.SendAlertMessage,
                                    metadata: {
                                        channel: logChannel,
                                    } as AutoModerationActionMetadataOptions,
                                };
                            }
                            return action;
                        });

                        if (!actionUpdated) {
                            newActions.push({
                                type: AutoModerationActionType.SendAlertMessage,
                                metadata: {
                                    channel: logChannel,
                                } as AutoModerationActionMetadataOptions,
                            });
                        }

                        const editOptions: AutoModerationRuleEditOptions = {
                            actions: newActions,
                        };

                        await rule.edit(editOptions);
                    }
                } catch (err) {
                    console.error(
                        `Error updating rule ${mod.id} with new log channel:`,
                        err,
                    );
                }
            }
        } else {
            console.error('AutoModManager is not available.');
        }

        const setupConfirmationEmbed = createSetupConfirmationEmbed(
            `Created log channel ${logChannel.name} and set it for auto-moderation logs.`,
        );
        await interaction.reply({
            embeds: [setupConfirmationEmbed],
            ephemeral: true,
        });

        const yesButton = new ButtonBuilder()
            .setCustomId('setup-timeout-yes')
            .setLabel('Yes')
            .setStyle(ButtonStyle.Primary);
        const noButton = new ButtonBuilder()
            .setCustomId('setup-timeout-no')
            .setLabel('No')
            .setStyle(ButtonStyle.Secondary);
        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            yesButton,
            noButton,
        );

        const timeoutSetupEmbed = createTimeoutSetupEmbed(
            'Would you like to set up timeouts for offenders?',
        );
        await interaction.followUp({
            embeds: [timeoutSetupEmbed],
            components: [row],
            ephemeral: true,
        });
    },
} satisfies Command;
