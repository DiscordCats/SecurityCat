import {Command} from '../../types/discord';
import {ButtonInteraction, EmbedBuilder} from 'discord.js';

export default {
    custom_id: 'deny-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        try {
            const denyEmbed = new EmbedBuilder()
                .setTitle('Denied')
                .setDescription('Report denied.')
                .setColor('Red');

            await interaction.reply({
                embeds: [denyEmbed],
                ephemeral: true
            });

            await interaction.message.delete();
        } catch (error) {
            console.error('Error deleting the report message:', error);
        }
    },
} satisfies Command;
