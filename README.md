# Discord.JS TypeScript Bot Template

This is a template that people can use to get their Discord bots setup nice and quickly with type safety and a good structure.

With this, there is event and interaction handling, all seperated into different files. It allows for all different types of Discord events to be handled and all different types of interactions to be handled, including autocomplete and modals.

## Setup

1. Clone the repository
2. Run `npm install`
3. Rename `.env.example` to `.env` and fill in the values, CLIENT_ID is theID of your bot and TOKEN is the token of your bot
4. Run `npm run start` to start the bot, if you want the bot to restart on every change, you can do `npm run start:watch`.

## Adding Commands

1. Within the `src/interactions` folder, there is already a `misc` folder which contains all the misc commands I have already catered for. You can add more folders for different categories of commands, but it doesn't really matter, there just needs to be folders to seperate the commands evenly for better command structure
2. Within the folder you want to add a command to, create a new file with the name of the command you want to add for better structure, but yet again it doesn't really matter.
3. In this file you will have to import the `Command` class from `../../types/discord`. For ease of use though, I'd recommend just copying the `help.ts` command and modifying that to your use case.
4. Make sure you set the role correctly and all the relevent values, errors should pop up in your IDE if you get anything wrong. Make sure you have Intellisense enabled in your IDE.
5. Once you have added the command, you just need to start the bot and the command should be available to use.
6. To add stuff that isn't slash commands, you will just need to modify the role, commands have the role of `CHAT_INPUT` by default, but you can change this for whatever case, like `BUTTON` or `SELECT_MENU`

## Adding events

1. Within the `src/events` folder, I have already created a `discord` folder which contains all the discord based events, reason I have done this is to seperate events into different categories for better structure, like if you use Discord-player for example to play music, you may want to put that in the `discord-player` folder instead.
2. Within the folder you want to add an event to, create a new file with the name of the event you want to add for better structure, but yet again it doesn't really matter.
3. From here, setup the events like you usually would, just make sure to export an async function under default that takes the client as a parameter if you're in the Discord folder, this is so that the event can be setup correctly.
4. If you wish to add your own events category, you will need to edit the `src/index.ts` file to cater to that.

## Contributions

If you wish to contribute to this template, feel free to make a pull request and I will review it. If you have any issues, feel free to open an issue and I will try to help you out as best as I can.

## API Docs

### Command

With commands, the handler does not use the slash command builder Discord.JS has because of how the handler works. The handler doesn't just handle slash commands but handles other stuff like buttons and select menus. Because of this, the handler uses a custom command class that is used to handle all the commands.

The command class differs depending on the role of the command, here are the current roles you can choose and what they mean:

-   `CHAT_INPUT`: This is the role for slash commands, this is the role you want if you just want to make a slash command.
-   `MESSAGE_CONTEXT_MENU`: You know when you right click a message and apps will appear with a load of bots? This is the role for that.
-   `USER_CONTEXT_MENU`: Sometimes when you right click a user, apps will appear with a load of bots. If you want that, use this role.
-   `SELECT_MENU`: This is the role for select menus, this is the role you want if you want to make a select menu.
-   `BUTTON`: This is the role for button interactions, if you want something to happen when you click a button, use this role.
-   `MODAL_SUBMIT`: This is the role for modals that are submitted, if you want to do something when a modal is submitted, use this role.
-   `AUTOCOMPLETE`: When autocomplete is ran, this role will be triggered to get a response.

All these classes do different things as explained above, and because of that the information you need to give will differ. Here is the information you need to give for each role:

-   `CHAT_INPUT`: You need to give the name of the command, the description of the command, the options of the command and the default permission of the command. Some of these can be omitted and you can also add more, for more information check [the Discord Developer Docs](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure)
-   `MESSAGE_CONTEXT_MENU`: You need to give the name of the interaction, the default permission of the command and the description of the command. Some of these can be omitted and you can also add more, for more information check [the Discord Developer Docs](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure)
-   `USER_CONTEXT_MENU`: You will have to give the name of the interaction, the default permission of the command and the description of the command. Some of these can be omitted and you can also add more, for more information check [the Discord Developer Docs](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure)
-   `SELECT_MENU`: You will have to give the custom_id of the interaction (this is to indicate which select menu to work with when you interact with a certain select menu, you will add a custom_id to a select menu when you define it, make sure it's the same in the select menu file). Check the [Discord Developer Docs](https://discord.com/developers/docs/interactions/message-components#select-menus) for more information.
-   `BUTTON`: You will have to give the custom_id of the interaction (this is to indicate which button interaction should be ran when you click a certain button, you will add a custom_id to a button when you define it, make sure it's the same in the button file). Check the [Discord Developer Docs](https://discord.com/developers/docs/interactions/message-components#buttons) for more information.
-   `MODAL_SUBMIT`: You will have to give the custom_id of the interaction (this is to indicate which modal should be ran when you submit a certain modal, you will add a custom_id to a modal when you define it, make sure it's the same in the modal file). Check the [Discord Developer Docs](https://discord.com/developers/docs/interactions/receiving-and-responding#interaction-response-object-modal) for more information.
-   `AUTOCOMPLETE`: You will have to give the name of the command that this autocomplete will be running on, for instance if you need autocomplete on the help command, you will call the autocomplete `help-autocomplete`. You need to add `-autocomplete` on every name here, you will get an error anyway if you don't. For more information check [the Discord Developer Docs](https://discord.com/developers/docs/interactions/application-commands#application-command-object-application-command-structure)

### As for running the interactions.

Usually intellisense will help with this, the role will be taken into consideration and the `interaction` variable will modify it's type depending on the role. You will be told if something doesn't exist on that role through your IDE, if it has intellisense enabled.
