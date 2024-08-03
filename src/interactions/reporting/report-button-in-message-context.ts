import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    MessageContextMenuCommandInteraction
} from 'discord.js';
import {Command} from '../../types/discord';
import dotenv from 'dotenv';

dotenv.config();

const reportGuildId = process.env.REPORT_GUILD_ID;
const reportChannelId = process.env.REPORT_CHANNEL_ID;

export default {
    name: 'Report Message',
    role: 'MESSAGE_CONTEXT_MENU',
    run: async (interaction: MessageContextMenuCommandInteraction) => {
        if (!reportGuildId || !reportChannelId) {
            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('Reporting is not configured properly.')
                .setColor('Red');

            return interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }

        const message = await interaction.targetMessage.fetch();
        const reporter = interaction.user;
        const reportedContent = message.content || '[No text content]';
        const reportedAuthor = message.author;

        const reportEmbed = new EmbedBuilder()
            .setTitle('Message Report')
            .setDescription(`A message has been reported.`)
            .addFields(
                {name: 'Reported by', value: `${reporter.tag} (${reporter.id})`},
                {name: 'Message Content', value: reportedContent},
                {name: 'Author', value: `${reportedAuthor.tag} (${reportedAuthor.id})`}
            )
            .setColor('Red')
            .setTimestamp();

        const approveButton = new ButtonBuilder()
            .setCustomId('approve-report')
            .setLabel('Approve')
            .setStyle(ButtonStyle.Success);

        const denyButton = new ButtonBuilder()
            .setCustomId('deny-report')
            .setLabel('Deny')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder<ButtonBuilder>().setComponents(approveButton, denyButton);

        try {
            const reportGuild = await interaction.client.guilds.fetch(reportGuildId);
            const reportChannel = await reportGuild.channels.fetch(reportChannelId);

            if (!reportChannel?.isTextBased()) {
                const errorEmbed = new EmbedBuilder()
                    .setTitle('Error')
                    .setDescription('Configured report channel is not a text channel.')
                    .setColor('Red');

                return interaction.reply({
                    embeds: [errorEmbed],
                    ephemeral: true
                });
            }

            await reportChannel.send({embeds: [reportEmbed], components: [row]});

            const successEmbed = new EmbedBuilder()
                .setTitle('Success')
                .setDescription('Message reported successfully.')
                .setColor('Green');

            await interaction.reply({
                embeds: [successEmbed],
                ephemeral: true
            });
        } catch (error) {
            console.error('Error sending report:', error);

            const errorEmbed = new EmbedBuilder()
                .setTitle('Error')
                .setDescription('There was an error reporting the message.')
                .setColor('Red');

            await interaction.reply({
                embeds: [errorEmbed],
                ephemeral: true
            });
        }
    },
} satisfies Command;
