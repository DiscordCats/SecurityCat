import { Command } from '../../types/discord';

export default {
    custom_id: 'blah',
    role: 'BUTTON',
    run: async (interaction) => {
        await interaction.reply({ content: 'blah' });
    },
} satisfies Command;
