import { Command } from '../../../types/discord';
import { AnySelectMenuInteraction } from 'discord.js';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import {
    createErrorEmbed,
    createRuleUpdatedEmbed,
} from '../../../utils/embeds';

export default {
    custom_id: 'rule-category-select',
    role: 'SELECT_MENU',
    run: async (interaction: AnySelectMenuInteraction) => {
        const selectedCategory = interaction.values[0];

        const originalContent = interaction.message.embeds[0]?.fields.find(
            (field) => field.name === 'Message Content',
        )?.value;

        const editedContent = interaction.message.embeds[0]?.fields.find(
            (field) => field.name === 'Edited Content',
        )?.value;

        const contentToAdd = editedContent || originalContent;

        if (!contentToAdd) {
            const errorEmbed = createErrorEmbed(
                'No content available to add to rules.',
            );
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const rulesPath = path.resolve(__dirname, '../../../../rules.json');
        const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

        if (!rules[selectedCategory]) {
            rules[selectedCategory] = { words: [], regex: [], allowed: [] };
        }

        rules[selectedCategory].words.push(contentToAdd);
        writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

        const ruleUpdatedEmbed = createRuleUpdatedEmbed(selectedCategory);
        await interaction.reply({
            embeds: [ruleUpdatedEmbed],
            ephemeral: true,
        });
    },
} satisfies Command;
