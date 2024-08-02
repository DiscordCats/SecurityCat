import {Command} from '../../types/discord';
import {ButtonInteraction} from 'discord.js';

export default {
    custom_id: 'deny-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        try {
            await interaction.reply({
                content: 'Report denied.',
                ephemeral: true
            });

            await interaction.message.delete();
        } catch (error) {
            console.error('Error deleting the report message:', error);
        }
    },
} satisfies Command;
