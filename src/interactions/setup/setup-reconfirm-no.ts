import { ButtonInteraction } from 'discord.js';
import { Command } from '../../types/discord';
import { createErrorEmbed } from '../../utils/embeds';

export default {
    custom_id: 'setup-reconfirm-no',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const errorEmbed = createErrorEmbed('Setup process cancelled.');
        await interaction.reply({
            embeds: [errorEmbed],
            ephemeral: true,
        });
    },
} satisfies Command;
