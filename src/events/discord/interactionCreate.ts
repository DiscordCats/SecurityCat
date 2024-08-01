import { Client, Interaction } from 'discord.js';
import { commands } from '../..';

export default async function (client: Client) {
    client.on('interactionCreate', async (interaction) => {
        let finder: string;
        if (!('commandName' in interaction)) {
            finder = interaction.customId;
        } else {
            finder = interaction.commandName;
            interaction.isAutocomplete() ? (finder += '-autocomplete') : finder;
        }
        const command = commands.get(finder);
        if (!command) return;
        console.log(`Executing interaction ${finder}...`);
        try {
            await (command.run as (interaction: Interaction) => unknown)(
                interaction,
            );
            console.log(`Interaction ${finder} executed successfully!`);
        } catch (error) {
            console.log(`Error while executing interaction ${finder}:`);
            console.error(error);
            if (interaction.isCommand()) {
                if (interaction.deferred || interaction.replied)
                    await interaction.editReply({
                        content:
                            'There was an error while executing this command!',
                    });
                else
                    await interaction.reply({
                        content:
                            'There was an error while executing this command!',
                        ephemeral: true,
                    });
            }
        }
    });
}
