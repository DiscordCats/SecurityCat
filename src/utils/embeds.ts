import { EmbedBuilder, Message } from 'discord.js';

export function createRuleViolationEmbed(
    message: Message<true>,
    moduleName: string,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Rule Violation')
        .setColor('Red')
        .setDescription(`A message from ${message.author.tag} was deleted.`)
        .addFields(
            { name: 'Channel', value: message.channel.name, inline: true },
            { name: 'Rule Violated', value: moduleName, inline: true },
            {
                name: 'Content',
                value: message.content || 'No content',
                inline: false,
            },
        )
        .setTimestamp();
}

export function createErrorEmbed(description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Error')
        .setDescription(description)
        .setColor('Red');
}

export function createManageReportEmbed(
    originalMessageContent: string,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Manage the reported content')
        .addFields({
            name: 'Message Content',
            value: originalMessageContent,
        })
        .setColor('Yellow');
}

export function createSetupConfirmationEmbed(
    description: string,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Setup Confirmation')
        .setDescription(description)
        .setColor('Green');
}

export function createTimeoutSetupEmbed(description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Timeout Setup')
        .setDescription(description)
        .setColor('Blue');
}

export function createCancelledEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Cancelled')
        .setDescription('Report management cancelled.')
        .setColor('Red');
}

export function createDeniedEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Denied')
        .setDescription('Report denied.')
        .setColor('Red');
}

export function createTimeoutSkippedEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Timeout Setup')
        .setDescription('Timeout setup skipped.')
        .setColor('LightGrey');
}

export function createReportEmbed(
    reporterTag: string,
    reporterId: string,
    reportedContent: string,
    authorTag: string,
    authorId: string,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Message Report')
        .setDescription(`A message has been reported.`)
        .addFields(
            { name: 'Reported by', value: `${reporterTag} (${reporterId})` },
            { name: 'Message Content', value: reportedContent },
            { name: 'Author', value: `${authorTag} (${authorId})` },
        )
        .setColor('Red')
        .setTimestamp();
}

export function createSuccessEmbed(description: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Success')
        .setDescription(description)
        .setColor('Green');
}

export function createRuleUpdatedEmbed(category: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Rule Updated')
        .setDescription(`Message added to ${category} rules.`)
        .setColor('Green');
}

export function createEditReportEmbed(editedContent: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Edit Report')
        .setDescription('Select a rules category to add the edited content')
        .addFields({ name: 'Edited Content', value: editedContent })
        .setColor('Yellow');
}

export function createToggleMessageEmbed(enabled: boolean): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Block Message Action')
        .setDescription(
            enabled
                ? 'BlockMessage action has been enabled.'
                : 'BlockMessage action has been disabled.',
        )
        .setColor(enabled ? 'Green' : 'Red');
}

export function createTimeoutDurationEmbed(
    moduleName: string,
    durationLabel: string | undefined,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Timeout Duration Updated')
        .setDescription(
            durationLabel
                ? `Timeout duration for module "${moduleName}" has been set to ${durationLabel}.`
                : `Timeout duration for module "${moduleName}" has been disabled.`,
        )
        .setColor(durationLabel ? 'Green' : 'Red');
}

export function createLogChannelSetEmbed(
    moduleName: string,
    channelId: string | null,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Log Channel Updated')
        .setDescription(
            `Log channel for module "${moduleName}" has been set to ${channelId ? `<#${channelId}>.` : 'none.'}`,
        )
        .setColor('Green');
}

export function createModuleAddedEmbed(
    moduleName: string,
    ruleId: string,
): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Module Added')
        .setDescription(`Added module "${moduleName}" with rule ID ${ruleId}.`)
        .setColor('Green');
}

export function createModuleRemovedEmbed(moduleName: string): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle('Module Removed')
        .setDescription(`Removed module "${moduleName}".`)
        .setColor('Green');
}
