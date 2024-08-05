import {Client, REST, Routes, ActivityType, Message} from 'discord.js';
import { readdirSync } from 'fs';
import {db, getServerModules} from '../../db';
import {Modules, servers} from '../../schema';
import {fetchGuild, sendLog} from '../../utils/discord';
import rules from '../../utils/rulesets'

export default async function (client: Client) {
    client.on('messageCreate', async (message) => {
        if(!message.guild) return;
        const modules = await getServerModules(message.guild.id)
        if(modules.length === 0) return;
        for(const module of modules){
            if(!module.enabled) continue;
            let content = message.content;
            const ruleSet = rules[module.name]
            if(!ruleSet) continue;
            if(module.bypass.channels.includes(message.channel.id)) continue;
            for(const role of message.member?.roles.cache.toJSON() || []){
                if(module.bypass.roles.includes(role.id)) continue;
            }
            for(const word of module.bypass.words){
                const regex = new RegExp(word, 'gi')
                content = content.replace(regex, '')
            }
            for(const word of ruleSet.words) {
                if(content.toLowerCase().includes(word.toLowerCase())){
                    await punish(client, message as Message<true>, module)
                    break;
                }
            }
        }
    });
}

async function punish(client: Client, message: Message<true>, module: Modules){
    await sendLog(client, message.guild.id, module.log, '')
    if(module.blockMessageEnabled) await message.delete();
    if(module.duration) await message.member?.timeout(parseInt(module.duration), module.name)
}