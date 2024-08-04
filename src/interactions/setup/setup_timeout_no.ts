import { ButtonInteraction } from 'discord.js';
import { Command } from '../../types/discord';

export default {
    custom_id: 'setup-timeout-no',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        await interaction.reply({
            content: 'Timeout setup skipped.',
            ephemeral: true,
        });
    },
} satisfies Command;
