import {Command} from '../../types/discord';
import {ButtonInteraction} from 'discord.js';

export default {
    custom_id: 'cancel-report',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        await interaction.reply({
            content: 'Report management cancelled.',
            ephemeral: true
        });
    },
} satisfies Command;
