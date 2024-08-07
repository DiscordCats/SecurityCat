import { Command } from '../../../types/discord';
import { ButtonInteraction } from 'discord.js';
import { createCancelledEmbed } from '../../../utils/embeds';

export default {
    custom_id: 'cancel-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const cancelEmbed = createCancelledEmbed();
        await interaction.reply({
            embeds: [cancelEmbed],
            ephemeral: true,
        });
    },
} satisfies Command;
