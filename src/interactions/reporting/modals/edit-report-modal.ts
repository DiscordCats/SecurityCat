import { Command } from '../../../types/discord';
import {
    ActionRowBuilder,
    ModalSubmitInteraction,
    StringSelectMenuBuilder,
} from 'discord.js';
import rules from '../../../../rules.json';
import { createEditReportEmbed } from '../../../utils/embeds';

export default {
    custom_id: 'edit-report-modal',
    role: 'MODAL_SUBMIT',
    run: async (interaction: ModalSubmitInteraction) => {
        const editedContent =
            interaction.fields.getTextInputValue('report-input');

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-category-select')
            .setPlaceholder('Select a rule category')
            .addOptions(
                Object.keys(rules).map((key) => ({
                    label: key,
                    value: key,
                })),
            );

        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                selectMenu,
            );

        const embed = createEditReportEmbed(editedContent);

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true,
        });
    },
} satisfies Command;
