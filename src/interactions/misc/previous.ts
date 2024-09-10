import {ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder} from "discord.js";
import { Command } from "../../types/discord";
import { commands } from "../../index";

export default {
    custom_id: "previous",
    role: "BUTTON",
    run: async (interaction) => {
        if (interaction.user.id !== interaction.message.interaction?.user.id) {
            return interaction.reply({
                content: "This is not your command!",
                ephemeral: true,
            });
        }
        const originEmbed = interaction.message.embeds[0];
        const pageNumber = parseInt(
            originEmbed.footer?.text.split(" ")[1] as string,
        );

        let fields: { name: string; value: string }[] = [];
        for (const [name, command] of commands) {
            if (command.role === "CHAT_INPUT")
                fields.push({ name: name, value: command.description });
        }
        const pageCount = Math.ceil(fields.length / 10);
        const footer = `Page ${pageNumber - 1}/${pageCount.toString()}`;

        fields = fields.slice((pageNumber - 2) * 10, (pageNumber - 1) * 10);

        const embed_ = new EmbedBuilder()
            .setColor('Green')
            .setTitle(originEmbed.title)
            .setDescription(originEmbed.description)
            .addFields(fields)
            .setFooter({ text: footer });

        let previous = new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("Previous Page")
            .setStyle(ButtonStyle.Primary);

        const next = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("Next Page")
            .setStyle(ButtonStyle.Primary);

        if (pageNumber - 1 === 1) {
            previous.setDisabled(true);
        }

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            previous,
            next,
        );
        await interaction.message.edit({ embeds: [embed_], components: [row] });
        await interaction.deferUpdate();
    },
} satisfies Command;
