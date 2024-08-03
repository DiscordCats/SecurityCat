import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { Command } from '../../types/discord';

export default {
    name: 'help',
    role: 'CHAT_INPUT',
    description: 'Get help with the bot!',
    options: [
        {
            type: 3,
            name: 'command',
            description: 'The command you need help with',
            required: false,
            autocomplete: true,
        },
    ],
    run: async (interaction) => {
        const button = new ButtonBuilder()
            .setCustomId('blah')
            .setLabel('Blah')
            .setStyle(ButtonStyle.Primary);
        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(button);
        await interaction.reply({ content: 'blah', components: [row] });
    },
} satisfies Command;
