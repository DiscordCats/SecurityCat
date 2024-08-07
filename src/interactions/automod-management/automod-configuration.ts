import {
    ApplicationCommandOptionType,
    AutoModerationActionOptions,
    AutoModerationActionType,
    AutoModerationRuleEventType,
    AutoModerationRuleTriggerType,
    ChatInputCommandInteraction,
    PermissionFlagsBits,
} from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { Modules, servers } from '../../schema';
import { eq } from 'drizzle-orm';
import rules from '../../../rules.json';
import {
    createErrorEmbed,
    createToggleMessageEmbed,
    createTimeoutDurationEmbed,
    createLogChannelSetEmbed,
    createModuleAddedEmbed,
    createModuleRemovedEmbed,
} from '../../utils/embeds';

// TODO: The "too tired to do it today so ill do it tomorrow list:
//  Fix it saying stuff like "1 week seconds" when changing duration
//  add bypass roles / channels
//  [ x ] use actual embeds
//  probably make the command names shorter
//  if your name is Jay, you should split this command apart if possible, I couldn't figure out how to make a subcommand multi-file

const timeoutDurations = [
    { label: 'Off', value: 'off' },
    { label: '60 secs', value: '60' },
    { label: '5 mins', value: '300' },
    { label: '10 mins', value: '600' },
    { label: '1 hour', value: '3600' },
    { label: '1 day', value: '86400' },
    { label: '1 week', value: '604800' },
];

export default {
    name: 'config',
    description: 'Configure server settings',
    options: [
        {
            name: 'block-messages',
            description: 'Manage BlockMessage action for AutoMod rules',
            type: ApplicationCommandOptionType.SubcommandGroup,
            options: [
                {
                    name: 'toggle',
                    description: 'Toggle BlockMessage action for a module',
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            type: ApplicationCommandOptionType.String,
                            name: 'module',
                            description:
                                'The module name to toggle BlockMessage action',
                            required: true,
                            autocomplete: true,
                        },
                    ],
                },
            ],
        },
        {
            name: 'timeout-duration',
            description: 'Change the timeout duration for a specific module',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'module',
                    description: 'The module name to change timeout duration',
                    required: true,
                    autocomplete: true,
                },
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'duration',
                    description: 'The new timeout duration',
                    required: true,
                    choices: timeoutDurations.map((duration) => ({
                        name: duration.label,
                        value: duration.value,
                    })),
                },
            ],
        },
        {
            name: 'log-channel',
            description: 'Set the log channel for a specific module',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'module',
                    description: 'The module name to set the log channel for',
                    required: true,
                    autocomplete: true,
                },
                {
                    type: ApplicationCommandOptionType.Channel,
                    name: 'channel',
                    description: 'The log channel to set',
                    required: true,
                },
            ],
        },
        {
            name: 'add-module',
            description: 'Add a new automod module to the server',
            type: ApplicationCommandOptionType.Subcommand,
            options: [
                {
                    type: ApplicationCommandOptionType.String,
                    name: 'module',
                    description:
                        'The module you want to add (e.g. scams, invites, brainrot)',
                    required: true,
                    autocomplete: true,
                },
            ],
        },
        {
            name: 'remove-module',
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
        },
    ],
    role: 'CHAT_INPUT',
    default_member_permissions: PermissionFlagsBits.ManageGuild,
    run: async (interaction: ChatInputCommandInteraction) => {
        const subcommandGroup = interaction.options.getSubcommandGroup();
        const subcommand = interaction.options.getSubcommand();
        const moduleName = interaction.options.getString('module');
        const serverId = interaction.guild?.id;

        if (!serverId) {
            return interaction.reply({
                embeds: [createErrorEmbed('Unable to determine server ID.')],
                ephemeral: true,
            });
        }

        const serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        if (!serverRecord) {
            return interaction.reply({
                embeds: [createErrorEmbed('Server record not found.')],
                ephemeral: true,
            });
        }

        const autoModManager = interaction.guild?.autoModerationRules;
        if (!autoModManager) {
            return interaction.reply({
                embeds: [
                    createErrorEmbed('Unable to access AutoModerationRules.'),
                ],
                ephemeral: true,
            });
        }

        if (!moduleName) {
            return interaction.reply({
                embeds: [createErrorEmbed('Module name must be provided.')],
                ephemeral: true,
            });
        }

        const module = serverRecord.modules.find(
            (mod: Modules) => mod.name === moduleName,
        );
        const ruleId = module?.id;

        if (subcommandGroup === 'block-messages' && subcommand === 'toggle') {
            if (!ruleId) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            `No module found with the name "${moduleName}".`,
                        ),
                    ],
                    ephemeral: true,
                });
            }

            try {
                const rule = await autoModManager.fetch(ruleId);
                if (!rule) {
                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                `Rule not found for module "${moduleName}".`,
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                let blockMessageActionExists = false;
                const newActions: AutoModerationActionOptions[] = rule.actions
                    .map((action) => {
                        if (
                            action.type ===
                            AutoModerationActionType.BlockMessage
                        ) {
                            blockMessageActionExists = true;
                            return null; // Mark for removal
                        }
                        if (
                            action.type ===
                            AutoModerationActionType.SendAlertMessage
                        ) {
                            return {
                                ...action,
                                metadata: {
                                    ...action.metadata,
                                    channel:
                                        action.metadata.channelId ??
                                        'never gonna give you up',
                                },
                            };
                        }
                        return action;
                    })
                    .filter(
                        (action) => action !== null,
                    ) as AutoModerationActionOptions[]; // Filter out the nulls

                if (!blockMessageActionExists) {
                    newActions.push({
                        type: AutoModerationActionType.BlockMessage,
                        metadata: {},
                    });
                }

                await rule.edit({ actions: newActions });

                const updatedModules = serverRecord.modules.map((mod) =>
                    mod.name === moduleName
                        ? {
                              ...mod,
                              blockMessageEnabled: !blockMessageActionExists,
                          }
                        : mod,
                );

                await db
                    .update(servers)
                    .set({ modules: updatedModules })
                    .where(eq(servers.id, serverId))
                    .execute();

                return interaction.reply({
                    embeds: [
                        createToggleMessageEmbed(!blockMessageActionExists),
                    ],
                    ephemeral: true,
                });
            } catch (err) {
                console.error(
                    `Error toggling BlockMessage action for rule ${ruleId}:`,
                    err,
                );
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            'Failed to toggle BlockMessage action.',
                        ),
                    ],
                    ephemeral: true,
                });
            }
        } else if (subcommand === 'timeout-duration') {
            const durationValue = interaction.options.getString('duration');
            const duration = durationValue === 'off' ? '' : durationValue;

            if (!ruleId) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            `No module found with the name "${moduleName}".`,
                        ),
                    ],
                    ephemeral: true,
                });
            }

            try {
                const rule = await autoModManager.fetch(ruleId);
                if (!rule) {
                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                `Rule not found for module "${moduleName}".`,
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                let timeoutActionExists = false;

                const newActions: AutoModerationActionOptions[] = rule.actions
                    .map((action) => {
                        if (
                            action.type ===
                            AutoModerationActionType.SendAlertMessage
                        ) {
                            return {
                                ...action,
                                metadata: {
                                    ...action.metadata,
                                    channel:
                                        action.metadata.channelId ??
                                        'placeholder-channel',
                                },
                            };
                        }

                        if (action.type === AutoModerationActionType.Timeout) {
                            timeoutActionExists = true;
                            if (duration !== '') {
                                return {
                                    type: AutoModerationActionType.Timeout,
                                    metadata: {
                                        durationSeconds: parseInt(
                                            <string>duration,
                                            10,
                                        ),
                                    },
                                };
                            } else {
                                return null; // Remove action if duration is off
                            }
                        }
                        return action;
                    })
                    .filter(
                        (action) => action !== null,
                    ) as AutoModerationActionOptions[];

                if (!timeoutActionExists && duration !== '') {
                    newActions.push({
                        type: AutoModerationActionType.Timeout,
                        metadata: {
                            durationSeconds: parseInt(<string>duration, 10),
                        },
                    });
                }

                await rule.edit({ actions: newActions });

                const updatedModules = serverRecord.modules.map((mod) =>
                    mod.name === moduleName
                        ? { ...mod, duration: duration ?? 'defaultDuration' }
                        : mod,
                );

                await db
                    .update(servers)
                    .set({ modules: updatedModules })
                    .where(eq(servers.id, serverId))
                    .execute();

                const durationLabel = timeoutDurations.find(
                    (d) => d.value === durationValue,
                )?.label;

                return interaction.reply({
                    embeds: [
                        createTimeoutDurationEmbed(moduleName, durationLabel),
                    ],
                    ephemeral: true,
                });
            } catch (err) {
                console.error(
                    `Error updating timeout duration for rule ${ruleId}:`,
                    err,
                );
                return interaction.reply({
                    embeds: [
                        createErrorEmbed('Failed to update timeout duration.'),
                    ],
                    ephemeral: true,
                });
            }
        } else if (subcommand === 'log-channel') {
            const channelId = interaction.options.getChannel('channel')?.id;

            if (!channelId) {
                return interaction.reply({
                    embeds: [createErrorEmbed('Channel must be provided.')],
                    ephemeral: true,
                });
            }

            if (!ruleId) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            `No module found with the name "${moduleName}".`,
                        ),
                    ],
                    ephemeral: true,
                });
            }

            try {
                const rule = await autoModManager.fetch(ruleId);
                if (!rule) {
                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                `Rule not found for module "${moduleName}".`,
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                // Update the log channel in the database and in the rule actions
                const updatedModules = serverRecord.modules.map((mod) =>
                    mod.name === moduleName ? { ...mod, log: channelId } : mod,
                );

                await db
                    .update(servers)
                    .set({ modules: updatedModules })
                    .where(eq(servers.id, serverId))
                    .execute();

                let actionUpdated = false;
                const newActions: AutoModerationActionOptions[] =
                    rule.actions.map((action) => {
                        if (
                            action.type ===
                            AutoModerationActionType.SendAlertMessage
                        ) {
                            actionUpdated = true;
                            return {
                                type: AutoModerationActionType.SendAlertMessage,
                                metadata: {
                                    channel: channelId,
                                },
                            };
                        }
                        return action;
                    });

                if (!actionUpdated) {
                    newActions.push({
                        type: AutoModerationActionType.SendAlertMessage,
                        metadata: {
                            channel: channelId,
                        },
                    });
                }

                await rule.edit({ actions: newActions });

                return interaction.reply({
                    embeds: [createLogChannelSetEmbed(moduleName, channelId)],
                    ephemeral: true,
                });
            } catch (err) {
                console.error(
                    `Error updating log channel for rule ${ruleId}:`,
                    err,
                );
                return interaction.reply({
                    embeds: [createErrorEmbed('Failed to update log channel.')],
                    ephemeral: true,
                });
            }
        } else if (subcommand === 'add-module') {
            if (module) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            `The module "${moduleName}" is already enabled.`,
                        ),
                    ],
                    ephemeral: true,
                });
            }

            try {
                const rule = await autoModManager.create({
                    name: `${moduleName} Rule`,
                    eventType: AutoModerationRuleEventType.MessageSend,
                    triggerType: AutoModerationRuleTriggerType.Keyword,
                    triggerMetadata: {
                        keywordFilter: rules[moduleName]?.words || [],
                        regexPatterns: rules[moduleName]?.regex || [],
                    },
                    actions: [
                        { type: AutoModerationActionType.BlockMessage },
                        {
                            type: AutoModerationActionType.SendAlertMessage,
                            metadata: {
                                channel: serverRecord.id,
                            },
                        },
                    ],
                    enabled: true,
                });

                const updatedModules = [
                    ...serverRecord.modules,
                    {
                        enabled: true,
                        name: moduleName,
                        id: rule.id,
                        log: serverRecord.id,
                        duration: '',
                        bypass: {
                            words: [],
                            roles: [],
                            channels: [],
                        },
                        blockMessageEnabled: true,
                    },
                ];

                await db
                    .update(servers)
                    .set({ modules: updatedModules })
                    .where(eq(servers.id, serverId))
                    .execute();

                await interaction.reply({
                    embeds: [createModuleAddedEmbed(moduleName, rule.id)],
                    ephemeral: true,
                });
            } catch (err) {
                console.error(`Error adding module "${moduleName}":`, err);
                return interaction.reply({
                    embeds: [createErrorEmbed('Failed to add the module.')],
                    ephemeral: true,
                });
            }
        } else if (subcommand === 'remove-module') {
            if (!module) {
                return interaction.reply({
                    embeds: [
                        createErrorEmbed(
                            `The module "${moduleName}" is not enabled.`,
                        ),
                    ],
                    ephemeral: true,
                });
            }

            try {
                if (!module.id) {
                    return interaction.reply({
                        embeds: [
                            createErrorEmbed(
                                `No module found with the name "${moduleName}".`,
                            ),
                        ],
                        ephemeral: true,
                    });
                }

                const rule = await autoModManager.fetch(module.id);
                if (rule) {
                    await rule.delete();
                }

                const updatedModules = serverRecord.modules.filter(
                    (mod) => mod.name !== moduleName,
                );

                await db
                    .update(servers)
                    .set({ modules: updatedModules })
                    .where(eq(servers.id, serverId))
                    .execute();

                await interaction.reply({
                    embeds: [createModuleRemovedEmbed(moduleName)],
                    ephemeral: true,
                });
            } catch (err) {
                console.error(`Error removing module "${moduleName}":`, err);
                return interaction.reply({
                    embeds: [createErrorEmbed('Failed to remove the module.')],
                    ephemeral: true,
                });
            }
        }
    },
} satisfies Command;
