import { Client, Message } from 'discord.js';
import { getServerModules } from '../../db';
import { Modules } from '../../schema';
import { sendLog } from '../../utils/discord';
import rules from '../../utils/rulesets';

export default async function (client: Client) {
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!newMessage.guild) return;
        if (!newMessage.content || newMessage.content === oldMessage.content) return;
        const modules = (await getServerModules(newMessage.guild.id)).filter(module => module.enabled);
        if (modules.length === 0) return;

        const memberRoles = newMessage.member?.roles.cache.map(role => role.id) || [];

        let content = newMessage.content.toLowerCase();

        for (const module of modules) {
            const ruleSet = rules[module.name];
            if (!ruleSet) continue;
            if (module.bypass.channels.includes(newMessage.channel.id)) continue;
            if (memberRoles.some(roleId => module.bypass.roles.includes(roleId))) continue;

            for (const word of module.bypass.words) {
                const regex = new RegExp(word, 'gi');
                content = content.replace(regex, '');
            }

            if (ruleSet.words.some(word => content.includes(word.toLowerCase()))) {
                await punish(client, newMessage as Message<true>, module);
                break;
            }
        }
    });
}

async function punish(client: Client, message: Message<true>, module: Modules) {
    try {
        await sendLog(client, message.guild.id, module.log, '');

        if (module.blockMessageEnabled) await message.delete();

        if (module.duration) {
            const duration = parseInt(module.duration);
            await message.member?.timeout(duration, module.name);
        }
    } catch (error) {
        console.error('Error during punishment:', error);
    }
}
