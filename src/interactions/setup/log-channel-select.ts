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

export default {
    custom_id: 'log-channel-select',
    role: 'SELECT_MENU',
    run: async (interaction: AnySelectMenuInteraction) => {
        if (!interaction.isChannelSelectMenu()) {
            return interaction.reply({
                content: 'Invalid interaction type.',
                ephemeral: true,
            });
        }

        const selectedChannelId = interaction.values[0];
        const serverId = interaction.guild?.id;

        if (!serverId) {
            return interaction.reply({
                content: 'Server ID not found.',
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
            return interaction.reply({
                content: 'No server record found.',
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
            console.log('AutoModManager accessed successfully.');

            for (const mod of updatedModules) {
                try {
                    console.log(
                        `Fetching rule for module ${mod.name} with ID ${mod.id}`,
                    );
                    const rule = await autoModManager.fetch(mod.id);
                    if (rule) {
                        console.log(
                            `Rule found for module ${mod.name}, updating log channel.`,
                        );
                        const existingActions = rule.actions;

                        let actionUpdated = false;
                        const newActions = existingActions.map((action) => {
                            if (
                                action.type ===
                                AutoModerationActionType.SendAlertMessage
                            ) {
                                console.log(
                                    `Updating log channel for rule ${mod.id}`,
                                );
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
                            console.log(
                                `No SendAlertMessage action found for rule ${mod.id}, adding new action.`,
                            );
                            newActions.push({
                                type: AutoModerationActionType.SendAlertMessage,
                                metadata: {
                                    channel: selectedChannelId,
                                } as AutoModerationActionMetadataOptions,
                            });
                        }

                        console.log(
                            'Sending the following actions to Discord:',
                            JSON.stringify(newActions, null, 2),
                        );

                        const editOptions: AutoModerationRuleEditOptions = {
                            actions: newActions,
                        };

                        await rule.edit(editOptions);
                        console.log(
                            `Successfully updated rule ${mod.id} with new log channel.`,
                        );
                    } else {
                        console.log(`No rule found for module ${mod.name}`);
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
