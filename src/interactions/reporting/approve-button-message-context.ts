import { Command } from '../../types/discord';

export default {
    custom_id: "approve-report",
    role: "BUTTON",
    run: async (interaction) => {
        await interaction.reply({ content: "Report accepted.", ephemeral: true });
        // functionality for denying the report goes here
    },
} satisfies Command;