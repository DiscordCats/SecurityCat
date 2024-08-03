import { Command } from '../../../types/discord';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import rules from '../../../../rules.json';

export default {
    custom_id: 'approve-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const originalMessageContent =
            interaction.message.embeds[0]?.fields.find(
                (field) => field.name === 'Message Content',
            )?.value;

        if (!originalMessageContent) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Original message content is not available.')
                .setColor('Red');

            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const newEmbed = new EmbedBuilder()
            .setTitle('Manage the reported content')
            .addFields({
                name: 'Message Content',
                value: originalMessageContent,
            })
            .setColor('Yellow');

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

        // this would have to be followUp if you want a response that goes before processing
        await interaction.reply({
            embeds: [newEmbed],
            components: [row1, row2],
            ephemeral: true,
        });
    },
} satisfies Command;
