import {
    ApplicationCommandOptionType,
    AutoModerationActionType,
    AutoModerationRuleEventType,
    AutoModerationRuleTriggerType,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle, PermissionFlagsBits
} from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';
import rules from '../../../rules.json';
import { eq, sql } from 'drizzle-orm';

export default {
    name: 'config',
    description: 'Configure server settings',
    options: [
        {
            name: 'addmodule',
            description: 'Add a new automod module to the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'module',
                    description: 'The module you want to add (e.g. scams, invites, brainrot)',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
        {
            name: 'removemodule',
            description: 'Remove an existing automod module from the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'module',
                    description: 'The module you want to remove',
                    required: true,
                    autocomplete: true,
                },
            ],
        }
    ],
    role: 'CHAT_INPUT',
    default_member_permissions: PermissionFlagsBits.ManageGuild,
    run: async (interaction: ChatInputCommandInteraction) => {
        const subcommand = interaction.options.getSubcommand();
        const moduleName = interaction.options.getString('module');

        if (!moduleName) {
            return interaction.reply({ content: 'Module name must be provided.', ephemeral: true });
        }

        if (!Object.keys(rules).includes(moduleName)) {
            return interaction.reply({ content: 'Invalid module name. Please select a valid module.', ephemeral: true });
        }

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

        if (!serverRecord || !serverRecord.automod_channel) {
            const button = new ButtonBuilder()
                .setCustomId("create_log_channel")
                .setLabel("Create log channel")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);

            return interaction.reply({
                content: 'You must set a log channel for auto-moderation actions using the `/logchannel set` command before configuring modules.',
                components: [row],
                ephemeral: true
            });
        }

        if (subcommand === 'addmodule') {
            if (serverRecord.modules?.includes(moduleName)) {
                return interaction.reply({ content: `The module "${moduleName}" is already enabled.`, ephemeral: true });
            }

            await db.insert(servers)
                .values({
                    id: serverId,
                    modules: [moduleName],
                    automod_ids: [],
                    automod_channel: serverRecord.automod_channel,
                    extras: null
                })
                .onConflictDoUpdate({
                    target: servers.id,
                    set: {
                        modules: sql`array_append(${servers.modules}, ${moduleName})`
                    }
                })
                .execute();

            const autoModManager = interaction.guild?.autoModerationRules;
            if (!autoModManager) {
                return interaction.reply({ content: 'Unable to access AutoModerationRules.', ephemeral: true });
            }

            const rule = await autoModManager.create({
                name: `${moduleName} Rule`,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: {
                    keywordFilter: rules[moduleName].words,
                    regexPatterns: rules[moduleName].regex,
                },
                actions: [
                    { type: AutoModerationActionType.BlockMessage },
                    {
                        type: AutoModerationActionType.SendAlertMessage,
                        metadata: {
                            channel: serverRecord.automod_channel,
                        }
                    }
                ],
                enabled: true
            });

            await db.update(servers)
                .set({
                    automod_ids: [...(serverRecord.automod_ids ?? []), rule.id]
                })
                .where(eq(servers.id, serverId))
                .execute();

            await interaction.reply(`Added module "${moduleName}" with rule ID ${rule.id}.`);
        } else if (subcommand === 'removemodule') {
            if (!serverRecord.modules?.includes(moduleName)) {
                return interaction.reply({ content: `The module "${moduleName}" is not enabled.`, ephemeral: true });
            }

            const autoModManager = interaction.guild?.autoModerationRules;
            if (!autoModManager) {
                return interaction.reply({ content: 'Unable to access AutoModerationRules.', ephemeral: true });
            }

            const updatedModules = serverRecord.modules.filter((mod: string) => mod !== moduleName);

            const ruleIdToRemove = serverRecord.automod_ids?.find(async (id) => {
                const rule = await autoModManager.fetch(id);
                return rule.name === `${moduleName} Rule`;
            });

            if (ruleIdToRemove) {
                try {
                    const rule = await autoModManager.fetch(ruleIdToRemove);
                    await rule.delete();
                } catch (err) {
                    console.error(`Error deleting rule ${ruleIdToRemove}:`, err);
                    return interaction.reply({ content: `Failed to remove the rule for "${moduleName}".`, ephemeral: true });
                }

                const updatedAutomodIds = serverRecord.automod_ids?.filter((id: string) => id !== ruleIdToRemove);

                await db.update(servers)
                    .set({
                        modules: updatedModules,
                        automod_ids: updatedAutomodIds
                    })
                    .where(eq(servers.id, serverId))
                    .execute();

                await interaction.reply(`Removed module "${moduleName}".`);
            } else {
                await interaction.reply({ content: `No associated rule found for module "${moduleName}".`, ephemeral: true });
            }
        }
    }
} satisfies Command;
