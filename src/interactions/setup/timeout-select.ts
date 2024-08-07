import { AnySelectMenuInteraction, AutoModerationActionType } from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';
import { eq } from 'drizzle-orm';
import { createSetupConfirmationEmbed } from '../../utils/embeds';

export default {
    custom_id: 'timeout-select',
    role: 'SELECT_MENU',
    run: async (interaction: AnySelectMenuInteraction) => {
        const duration = parseInt(interaction.values[0]);
        const serverId = interaction.guild?.id;

        if (!serverId) return;

        const serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        if (!serverRecord) return;

        const autoModManager = interaction.guild?.autoModerationRules;
        if (!autoModManager) return;

        for (const module of serverRecord.modules) {
            try {
                if (!module.id) continue;
                const rule = await autoModManager.fetch(module.id);

                let timeoutActionExists = false;

                const newActions = rule.actions.map((action) => {
                    if (
                        action.type ===
                        AutoModerationActionType.SendAlertMessage
                    ) {
                        return {
                            ...action,
                            metadata: {
                                channel:
                                    action.metadata.channelId ??
                                    'This will never be invoked since channelId is mandatory for the SendAlertMessage',
                            },
                        };
                    }

                    if (action.type === AutoModerationActionType.Timeout) {
                        timeoutActionExists = true;
                        return {
                            type: AutoModerationActionType.Timeout,
                            metadata: { durationSeconds: duration },
                        };
                    }
                    return action;
                });

                if (!timeoutActionExists) {
                    newActions.push({
                        type: AutoModerationActionType.Timeout,
                        metadata: { durationSeconds: duration },
                    });
                }

                await rule.edit({ actions: newActions });

                await db
                    .update(servers)
                    .set({
                        modules: serverRecord.modules.map((mod) =>
                            mod.id === module.id
                                ? { ...mod, duration: String(duration) }
                                : mod,
                        ),
                    })
                    .where(eq(servers.id, serverId))
                    .execute();
            } catch (err) {
                console.error(
                    `Error updating rule ${module.id} with timeout:`,
                    err,
                );
            }
        }

        const setupConfirmationEmbed = createSetupConfirmationEmbed(
            `Timeout set to ${duration} seconds.`,
        );
        await interaction.reply({
            embeds: [setupConfirmationEmbed],
            ephemeral: true,
        });
    },
} satisfies Command;
