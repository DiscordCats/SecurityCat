import { Command } from '../../../types/discord';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    StringSelectMenuBuilder,
} from 'discord.js';
import rules from '../../../../rules.json';
import {
    createErrorEmbed,
    createManageReportEmbed,
} from '../../../utils/embeds';

export default {
    custom_id: 'approve-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const originalMessageContent =
            interaction.message.embeds[0]?.fields.find(
                (field) => field.name === 'Message Content',
            )?.value;

        if (!originalMessageContent) {
            const errorEmbed = createErrorEmbed(
                'Original message content is not available.',
            );

            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const newEmbed = createManageReportEmbed(originalMessageContent);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-category-select')
            .setPlaceholder('Select a rule category')
            .addOptions(
                Object.keys(rules).map((key) => ({
                    label: key,
                    value: key,
                })),
            );

        const editButton = new ButtonBuilder()
            .setCustomId('edit-report')
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel-report')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row1 =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                selectMenu,
            );
        const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(
            editButton,
            cancelButton,
        );

        await interaction.reply({
            embeds: [newEmbed],
            components: [row1, row2],
            ephemeral: true,
        });
    },
} satisfies Command;
