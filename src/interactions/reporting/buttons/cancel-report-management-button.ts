import {Command} from '../../../types/discord';
import {ButtonInteraction, EmbedBuilder} from 'discord.js';

export default {
    custom_id: 'cancel-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const cancelEmbed = new EmbedBuilder()
            .setTitle('Cancelled')
            .setDescription('Report management cancelled.')
            .setColor('Red');

        await interaction.reply({
            embeds: [cancelEmbed],
            ephemeral: true
        });
    },
} satisfies Command;
