import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers } from '../../schema';
import rules from '../../../rules.json';
import { eq } from 'drizzle-orm';

export default {
    name: 'config-autocomplete',
    role: 'AUTOCOMPLETE',
    run: async (interaction) => {
        const subcommand = interaction.options.getSubcommand();
        const focusedValue = interaction.options.getFocused();
        const serverId = interaction.guild?.id;

        if (!serverId) {
            console.error('Server ID not found.');
            return interaction.respond([]);
        }

        const serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        let choices: string[] = [];

        if (subcommand === 'addmodule') {
            if (serverRecord && serverRecord.modules?.length) {
                const enabledModules = serverRecord.modules;
                choices = Object.keys(rules).filter(
                    (module) => !enabledModules.includes(module),
                );
            } else {
                choices = Object.keys(rules);
            }
        } else if (subcommand === 'removemodule') {
            if (serverRecord && serverRecord.modules?.length) {
                choices = serverRecord.modules;
            } else {
                return interaction.respond([]);
            }
        }

        const filteredChoices = choices.filter((choice) =>
            choice.toLowerCase().includes(focusedValue.toLowerCase()),
        );

        await interaction.respond(
            filteredChoices.map((choice) => ({ name: choice, value: choice })),
        );
    },
} satisfies Command;
