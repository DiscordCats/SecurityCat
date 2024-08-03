import { Command } from '../../../types/discord';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalBuilder,
    TextInputBuilder,
    TextInputStyle,
} from 'discord.js';

export default {
    custom_id: 'edit-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const modal = new ModalBuilder()
            .setCustomId('edit-report-modal')
            .setTitle('Edit Report');

        const reportInput = new TextInputBuilder()
            .setCustomId('report-input')
            .setLabel('Edit the report content')
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const actionRow =
            new ActionRowBuilder<TextInputBuilder>().addComponents(reportInput);

        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },
} satisfies Command;
