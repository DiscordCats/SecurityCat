import {Command} from '../../types/discord';
import {StringSelectMenuInteraction} from 'discord.js';
import {readFileSync, writeFileSync} from 'fs';
import path from 'path';

export default {
    custom_id: 'rule-category-select',
    role: 'SELECT_MENU',
    run: async (interaction: StringSelectMenuInteraction) => {
        const selectedCategory = interaction.values[0];

        const originalContent = interaction.message.embeds[0]?.fields.find(field => field.name === 'Message Content')?.value;

        const editedContentMatch = interaction.message.content.match(/Select a category to add the edited content: "(.*)"/);
        const editedContent = editedContentMatch ? editedContentMatch[1] : null;

        const contentToAdd = editedContent || originalContent;

        if (!contentToAdd) {
            return interaction.reply({
                content: 'No content available to add to rules.',
                ephemeral: true,
            });
        }

        const rulesPath = path.resolve(__dirname, '../../../rules.json');
        const rules = JSON.parse(readFileSync(rulesPath, 'utf-8'));

        if (!rules[selectedCategory]) {
            rules[selectedCategory] = {words: [], regex: [], allowed: []};
        }

        rules[selectedCategory].words.push(contentToAdd);
        writeFileSync(rulesPath, JSON.stringify(rules, null, 2), 'utf-8');

        await interaction.reply({
            content: `Message added to ${selectedCategory} rules.`,
            ephemeral: true
        });
    },
} satisfies Command;
