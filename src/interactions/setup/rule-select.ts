import {
    ActionRowBuilder,
    AnySelectMenuInteraction,
    AutoModerationActionType,
    AutoModerationRuleEventType,
    AutoModerationRuleTriggerType,
    ButtonBuilder,
    ButtonStyle,
    ChannelSelectMenuBuilder,
} from 'discord.js';
import {Command} from '../../types/discord';
import {db} from '../../db';
import {Modules, servers} from '../../schema';
import {eq} from 'drizzle-orm';
import rules from '../../../rules.json';

export default {
    custom_id: 'rule-select',
    role: 'SELECT_MENU',
    run: async (interaction: AnySelectMenuInteraction) => {
        const selectedRules = interaction.values;
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

        const newModules: Modules[] = [];

        for (const ruleName of selectedRules) {
            const rule = await autoModManager.create({
                name: `${ruleName} Rule`,
                eventType: AutoModerationRuleEventType.MessageSend,
                triggerType: AutoModerationRuleTriggerType.Keyword,
                triggerMetadata: {
                    keywordFilter: rules[ruleName].words,
                    regexPatterns: rules[ruleName].regex,
                },
                actions: [{type: AutoModerationActionType.BlockMessage}],
                enabled: true,
            });

            newModules.push({
                enabled: true, // assuming the module is enabled by default
                name: ruleName,
                id: rule.id,
                log: null, // Log channel will be set later
                duration: null, // Duration will be set later
                bypass: {
                    words: [],
                    roles: [],
                    channels: [],
                },
                blockMessageEnabled: true, // automatically set to true, because it enables it by default
            });
        }

        await db
            .update(servers)
            .set({modules: newModules})
            .where(eq(servers.id, serverId))
            .execute();

        // Prompt for log channel selection
        const channelSelectMenu = new ChannelSelectMenuBuilder()
            .setCustomId('log-channel-select')
            .setPlaceholder('Select a channel for auto-mod logs')
            .setMinValues(1)
            .setMaxValues(1);

        const createChannelButton = new ButtonBuilder()
            .setCustomId('create-log-channel')
            .setLabel('Create Log Channel')
            .setStyle(ButtonStyle.Primary);

        const row1 =
            new ActionRowBuilder<ChannelSelectMenuBuilder>().setComponents(
                channelSelectMenu,
            );
        const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
            createChannelButton,
        );

        await interaction.reply({
            content:
                'Please select a channel for auto-mod logs or create a new one:',
            components: [row1, row2],
            ephemeral: true,
        });
    },
} satisfies Command;
