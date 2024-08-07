import { ButtonInteraction } from 'discord.js';
import { Command } from '../../types/discord';
import { createTimeoutSkippedEmbed } from '../../utils/embeds';

export default {
    custom_id: 'setup-timeout-no',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const timeoutSkippedEmbed = createTimeoutSkippedEmbed();
        await interaction.reply({
            embeds: [timeoutSkippedEmbed],
            ephemeral: true,
        });
        // this needs to change the value of "duration" to off
    },
} satisfies Command;
