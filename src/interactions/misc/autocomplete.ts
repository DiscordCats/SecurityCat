import { Command } from '../../types/discord';

export default {
    name: 'help-autocomplete',
    role: 'AUTOCOMPLETE',
    run: async (interaction) => {
        await interaction.respond([{ value: 'hehe', name: 'hehe' }]);
    },
} satisfies Command;
