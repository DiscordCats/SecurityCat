import {
    ButtonInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Command } from '../../types/discord';

const timeoutDurations = [
    { label: '60 secs', value: '60' },
    { label: '5 mins', value: '300' },
    { label: '10 mins', value: '600' },
    { label: '1 hour', value: '3600' },
    { label: '1 day', value: '86400' },
    { label: '1 week', value: '604800' },
];

export default {
    custom_id: 'setup-timeout-yes',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const timeoutMenu = new StringSelectMenuBuilder()
            .setCustomId('timeout-select')
            .setPlaceholder('Select a timeout duration')
            .addOptions(timeoutDurations);

        const row =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                timeoutMenu,
            );

        await interaction.reply({
            content: 'Please select the timeout duration:',
            components: [row],
            ephemeral: true,
        });
    },
} satisfies Command;
