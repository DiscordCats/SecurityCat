import {Command} from '../../types/discord';
import {ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, StringSelectMenuBuilder} from 'discord.js';
import rules from '../../../rules.json';

export default {
    custom_id: 'approve-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const originalMessageContent = interaction.message.embeds[0]?.fields.find(field => field.name === 'Message Content')?.value;

        if (!originalMessageContent) {
            return interaction.reply({content: 'Original message content is not available.', ephemeral: true});
        }

        await interaction.reply({content: 'Report accepted.', ephemeral: true});

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-category-select')
            .setPlaceholder('Select a rule category')
            .addOptions(
                Object.keys(rules).map(key => ({
                    label: key,
                    value: key,
                }))
            );

        const editButton = new ButtonBuilder()
            .setCustomId('edit-report')
            .setLabel('Edit')
            .setStyle(ButtonStyle.Primary);

        const cancelButton = new ButtonBuilder()
            .setCustomId('cancel-report')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Danger);

        const row1 = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);
        const row2 = new ActionRowBuilder<ButtonBuilder>().setComponents(editButton, cancelButton);

        await interaction.followUp({
            content: 'Manage the reported content:',
            embeds: [interaction.message.embeds[0]],
            components: [row1, row2],
            ephemeral: true
        });
    },
} satisfies Command;
