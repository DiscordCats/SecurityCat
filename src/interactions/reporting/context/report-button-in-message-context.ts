import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageContextMenuCommandInteraction,
} from 'discord.js';
import { Command } from '../../../types/discord';
import dotenv from 'dotenv';
import {
    createErrorEmbed,
    createReportEmbed,
    createSuccessEmbed,
} from '../../../utils/embeds';

dotenv.config();

const reportGuildId = process.env.REPORT_GUILD_ID;
const reportChannelId = process.env.REPORT_CHANNEL_ID;

export default {
    name: 'Report Message',
    role: 'MESSAGE_CONTEXT_MENU',
    run: async (interaction: MessageContextMenuCommandInteraction) => {
        if (!reportGuildId || !reportChannelId) {
            const errorEmbed = createErrorEmbed(
                'Reporting is not configured properly.',
            );
            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }

        const message = await interaction.targetMessage.fetch();
        const reporter = interaction.user;
        const reportedContent = message.content || '[No text content]';
        const reportedAuthor = message.author;

        const reportEmbed = createReportEmbed(
            reporter.tag,
            reporter.id,
            reportedContent,
            reportedAuthor.tag,
            reportedAuthor.id,
        );

        const approveButton = new ButtonBuilder()
            .setCustomId('approve-report')
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId('deny-report')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(
            approveButton,
            denyButton,
        );

        try {
            const reportGuild =
                await interaction.client.guilds.fetch(reportGuildId);
            const reportChannel =
                await reportGuild.channels.fetch(reportChannelId);

            if (!reportChannel?.isTextBased()) {
                const errorEmbed = createErrorEmbed(
                    'Configured report channel is not a text channel.',
                );

                return interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
            }

            await reportChannel.send({
                embeds: [reportEmbed],
                components: [row],
            });

            const successEmbed = createSuccessEmbed(
                'Message reported successfully.',
            );

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: true,
            });
        } catch (error) {
            console.error('Error sending report:', error);

            const errorEmbed = createErrorEmbed(
                'There was an error reporting the message.',
            );

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }
    },
} satisfies Command;
