import { Command } from '../../types/discord';
import { db } from '../../db';
import { servers, Modules } from '../../schema';
import { eq } from 'drizzle-orm';
import rules from '../../../rules.json';

export default {
    name: 'config-autocomplete',
    role: 'AUTOCOMPLETE',
    run: async (interaction) => {
        const focusedValue = interaction.options.getFocused();
        const subcommand = interaction.options.getSubcommand(); // tells us which subcommand is being used
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

        if (!serverRecord) {
            return interaction.respond([]);
        }

        let choices: string[] = [];
        const enabledModules = serverRecord.modules.map((mod: Modules) => mod.name);

        if (subcommand === 'add-module') {
            // show modules that are not enabled
            choices = Object.keys(rules).filter((moduleName) => !enabledModules.includes(moduleName));
        } else if (subcommand === 'remove-module' || subcommand === 'block-messages' || subcommand === 'timeout-duration' || subcommand === 'log-channel') {
            // show enabled modules
            choices = enabledModules;
        }

        const filteredChoices = choices.filter((choice) =>
            choice.toLowerCase().includes(focusedValue.toLowerCase())
        );

        await interaction.respond(
            filteredChoices.map((choice) => ({ name: choice, value: choice }))
        );
    },
} satisfies Command;
