import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import { Command } from "../../types/discord";
import { commands } from "../../index";

export default {
    name: "help",
    role: "CHAT_INPUT",
    description: "Get help with the bot!",
    run: async (interaction) => {
        const embed_ = new EmbedBuilder()
            .setColor("Green")
            .setTitle("Help")
            .setDescription(
                "Here are the commands you can use with this bot.",
            );

        let fields: { name: string; value: string }[] = [];

        for (const [name, command] of commands) {
            if (command.role === "CHAT_INPUT")
                fields.push({ name: name, value: command.description });
        }

        let pagify = false;

        if (fields.length > 10) {
            const pageCount = Math.ceil(fields.length / 10);
            pagify = true;
            fields = fields.slice(0, 10);
            embed_.setFooter({
                text: `Page 1/${pageCount.toString()}`,
            });
        }

        embed_.addFields(fields);

        if (pagify) {
            const previous = new ButtonBuilder()
                .setCustomId("previous")
                .setLabel("Next Page")
                .setStyle(ButtonStyle.Primary)
                .setDisabled(true);
            const next = new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Previous Page")
                .setStyle(ButtonStyle.Primary);
            const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
                previous,
                next,
            );
            return await interaction.reply({
                embeds: [embed_],
                components: [row],
                ephemeral: true,
            });
        }
        await interaction.reply({ embeds: [embed_], ephemeral: true });
    },
} satisfies Command;
