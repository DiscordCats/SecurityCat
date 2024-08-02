import {Command} from '../../types/discord';
import {ActionRowBuilder, ModalSubmitInteraction, StringSelectMenuBuilder} from 'discord.js';
import rules from '../../../rules.json';

export default {
    custom_id: 'edit-report-modal',
    role: 'MODAL_SUBMIT',
    run: async (interaction: ModalSubmitInteraction) => {
        const editedContent = interaction.fields.getTextInputValue('report-input');

        await interaction.reply({content: `Edited report: ${editedContent}`, ephemeral: true});

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-category-select')
            .setPlaceholder('Select a rule category')
            .addOptions(
                Object.keys(rules).map(key => ({
                    label: key,
                    value: key,
                }))
            );

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(selectMenu);

        await interaction.followUp({
            content: `Select a category to add the edited content: "${editedContent}"`,
            components: [row],
            ephemeral: true
        });
    },
} satisfies Command;
