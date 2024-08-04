import {
    ButtonInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} from 'discord.js';
import { Command } from '../../types/discord';
import rules from '../../../rules.json';

export default {
    custom_id: 'setup-reconfirm-yes',
    role: 'BUTTON',
    run: async (interaction: ButtonInteraction) => {
        const ruleSelectMenu = new StringSelectMenuBuilder()
            .setCustomId('rule-select')
            .setPlaceholder('Select rules to enable')
            .setMinValues(1)
            .setMaxValues(Object.keys(rules).length)
            .addOptions(
                Object.keys(rules).map((rule) => ({
                    label: rule,
                    value: rule,
                })),
            );

        const ruleSelectRow =
            new ActionRowBuilder<StringSelectMenuBuilder>().setComponents(
                ruleSelectMenu,
            );

        await interaction.reply({
            content:
                'Please select the rules you want to enable for auto-moderation:',
            components: [ruleSelectRow],
            ephemeral: true,
        });
    },
} satisfies Command;
