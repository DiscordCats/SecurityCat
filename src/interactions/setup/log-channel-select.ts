import { Command } from '../../types/discord';
import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    AutoModerationActionMetadataOptions,
    AutoModerationActionType,
    AutoModerationRuleEditOptions,
    ButtonBuilder,
    ButtonStyle,
} from 'discord.js';
import { db } from '../../db';
import { servers } from '../../schema';
import { eq } from 'drizzle-orm';
import { createErrorEmbed } from '../../utils/embeds';

export default {
    custom_id: 'log-channel-select',
    role: 'SELECT_MENU',
    run: async (interaction: AnySelectMenuInteraction) => {
        if (!interaction.isChannelSelectMenu()) {
            const errorEmbed = createErrorEmbed('Invalid interaction type.');
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const selectedChannelId = interaction.values[0];
        const serverId = interaction.guild?.id;

        if (!serverId) {
            const errorEmbed = createErrorEmbed('Server ID not found.');
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        let serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        if (!serverRecord) {
            const errorEmbed = createErrorEmbed('No server record found.');
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const updatedModules = serverRecord.modules.map((module) => ({
            ...module,
            log: selectedChannelId,
        }));

        await db
            .update(servers)
            .set({ modules: updatedModules })
            .where(eq(servers.id, serverId))
            .execute();

        const autoModManager = interaction.guild?.autoModerationRules;
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
                                        channel: selectedChannelId,
                                    } as AutoModerationActionMetadataOptions,
                                };
                            }
                            return action;
                        });

                        if (!actionUpdated) {
                            newActions.push({
                                type: AutoModerationActionType.SendAlertMessage,
                                metadata: {
                                    channel: selectedChannelId,
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

        await interaction.reply({
            content: `Auto-mod log channel set to <#${selectedChannelId}>.`,
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

        await interaction.followUp({
            content: 'Would you like to set up timeouts for offenders?',
            components: [row],
            ephemeral: true,
        });
    },
} satisfies Command;
