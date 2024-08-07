import { Command } from '../../../types/discord';
import { ButtonInteraction } from 'discord.js';
import { createDeniedEmbed, createErrorEmbed } from '../../../utils/embeds';

export default {
    custom_id: 'deny-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        try {
            const denyEmbed = createDeniedEmbed();
            await interaction.reply({
                embeds: [denyEmbed],
                ephemeral: true,
            });

            await interaction.message.delete();
        } catch (error) {
            console.error('Error deleting the report message:', error);
            const errorEmbed = createErrorEmbed(
                'Error deleting the report message.',
            );
            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }
    },
} satisfies Command;
