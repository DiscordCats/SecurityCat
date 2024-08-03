import {Command} from '../../../types/discord';
import {ActionRowBuilder, EmbedBuilder, ModalSubmitInteraction, StringSelectMenuBuilder} from 'discord.js';
import rules from '../../../../rules.json';

export default {
    custom_id: 'edit-report-modal',
    role: 'MODAL_SUBMIT',
    run: async (interaction: ModalSubmitInteraction) => {
        const editedContent = interaction.fields.getTextInputValue('report-input');

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

        const embed = new EmbedBuilder()
            .setTitle('Edit Report')
            .setDescription('Select a rules category to add the edited content')
            .addFields({name: 'Edited Content', value: editedContent})
            .setColor('Yellow');

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: true
        });
    },
} satisfies Command;