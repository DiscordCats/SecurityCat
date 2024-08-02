import { Command } from '../../types/discord';

export default {
    custom_id: "deny-report",
    role: "BUTTON",
    run: async (interaction) => {
        await interaction.reply({ content: "Report denied.", ephemeral: true });
        // functionality for denying the report goes here
    },
} satisfies Command;
