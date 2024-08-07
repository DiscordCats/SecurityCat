import { Client, Message } from 'discord.js';
import { getServerModules } from '../../db';
import { Modules } from '../../schema';
import { sendLog } from '../../utils/discord';
import rules from '../../utils/rulesets';
import { createRuleViolationEmbed } from '../../utils/embeds';

export default async function (client: Client) {
    client.on('messageCreate', async (message) => {
        if (!message.guild) return;
        await handleMessage(client, message as Message<true>);
    });

    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!newMessage.guild) return;
        if (!newMessage.content || newMessage.content === oldMessage.content)
            return;
        if (newMessage.partial) {
            try {
                newMessage = await newMessage.fetch();
            } catch (error) {
                console.error('Error fetching partial message:', error);
                return;
            }
        }
        await handleMessage(client, newMessage as Message<true>);
    });
}

async function handleMessage(client: Client, message: Message<true>) {
    const modules = (await getServerModules(message.guild.id)).filter(
        (module) => module.enabled,
    );
    if (modules.length === 0) return;

    const memberRoles =
        message.member?.roles.cache.map((role) => role.id) || [];

    let content = message.content.toLowerCase();
    content = content.replace(/[.\s]/g, ''); // remove dots and whitespace

    for (const module of modules) {
        const ruleSet = rules[module.name];
        if (!ruleSet) continue;
        if (module.bypass.channels.includes(message.channel.id)) continue;
        if (memberRoles.some((roleId) => module.bypass.roles.includes(roleId)))
            continue;

        for (const word of module.bypass.words) {
            const regex = new RegExp(word, 'gi');
            content = content.replace(regex, '');
        }

        if (
            ruleSet.words.some((word) => content.includes(word.toLowerCase()))
        ) {
            await punish(client, message, module);
            break;
        }
    }
}

async function punish(client: Client, message: Message<true>, module: Modules) {
    try {
        const embed = createRuleViolationEmbed(message, module.name);
        await sendLog(client, message.guild.id, module.log, embed);
        if (module.blockMessageEnabled) await message.delete();

        if (module.duration) {
            const duration = parseInt(module.duration);
            await message.member?.timeout(duration, module.name);
        }
    } catch (error) {
        console.error('Error during punishment:', error);
    }
}
