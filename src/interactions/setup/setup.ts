import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';
import { eq } from 'drizzle-orm';
import rules from '../../../rules.json';
import { createErrorEmbed } from '../../utils/embeds';

export default {
    name: 'setup',
    role: 'CHAT_INPUT',
    description: 'Setup auto-moderation for the server',
    run: async (interaction) => {
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

        if (serverRecord) {
            const yesButton = new ButtonBuilder()
                .setCustomId('setup-reconfirm-yes')
                .setLabel('Yes')
                .setStyle(ButtonStyle.Danger);
            const noButton = new ButtonBuilder()
                .setCustomId('setup-reconfirm-no')
                .setLabel('No')
                .setStyle(ButtonStyle.Secondary);
            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                yesButton,
                noButton,
            );

            return interaction.reply({
                content:
                    'Server already setup. Would you like to resetup the server?',
                components: [row],
                ephemeral: true,
            });
        }

        // Automatically create server record if it doesn't exist
        await db
            .insert(servers)
            .values({ id: serverId, modules: [] })
            .execute();

        // Proceed to rule selection
        const ruleSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-select')
            .setPlaceholder('Select rules to enable')
            .setMinValues(1)
            .setMaxValues(Object.keys(rules).length)
            .addOptions(
                Object.keys(rules).map((rule) => ({
                    label: rule,
                    value: rule,
                })),
            );

        const ruleSelectRow =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                ruleSelectMenu,
            );

        await interaction.reply({
            content:
                'Please select the rules you want to enable for auto-moderation:',
            components: [ruleSelectRow],
            ephemeral: true,
        });
    },
} satisfies Command;
