import { ButtonInteraction } from 'discord.js';
import { Command } from '../../types/discord';

export default {
    custom_id: 'setup-reconfirm-no',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        await interaction.reply({
            content: 'Setup process cancelled.',
            ephemeral: true,
        });
    },
} satisfies Command;
