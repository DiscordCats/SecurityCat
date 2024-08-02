import type {
    AnySelectMenuInteraction,
    ApplicationCommandOption,
    AutocompleteInteraction,
    ButtonInteraction,
    ChatInputCommandInteraction,
    MessageContextMenuCommandInteraction,
    ModalSubmitInteraction,
    UserContextMenuCommandInteraction,
    StringSelectMenuInteraction,
} from "discord.js";

export type Command =
    | {
          role: "CHAT_INPUT";
          run: (interaction: ChatInputCommandInteraction) => unknown;
          name: string;
          name_localizations?: Record<string, string>;
          description: string;
          description_localizations?: Record<string, string>;
          options?: ApplicationCommandOption[];
          default_member_permissions?: bigint;
          nsfw?: boolean;
          integration_types?: number[];
          contexts?: number[];
      }
    | {
          role: "MESSAGE_CONTEXT_MENU";
          run: (interaction: MessageContextMenuCommandInteraction) => unknown;
          name: string;
          name_localizations?: Record<string, string>;
          description_localizations?: Record<string, string>;
          options?: ApplicationCommandOption[];
          default_member_permissions?: bigint;
          nsfw?: boolean;
          integration_types?: number[];
          contexts?: number[];
      }
    | {
          role: "USER_CONTEXT_MENU";
          run: (interaction: UserContextMenuCommandInteraction) => unknown;
          name: string;
          name_localizations?: Record<string, string>;
          description_localizations?: Record<string, string>;
          options?: ApplicationCommandOption[];
          default_member_permissions?: bigint;
          nsfw?: boolean;
          integration_types?: number[];
          contexts?: number[];
      }
    | {
          role: "SELECT_MENU";
          custom_id: string;
          run: (interaction: StringSelectMenuInteraction) => unknown;
      }
    | {
          role: "BUTTON";
          custom_id: string;
          run: (interaction: ButtonInteraction) => unknown;
      }
    | {
          role: "MODAL_SUBMIT";
          custom_id: string;
          run: (interaction: ModalSubmitInteraction) => unknown;
      }
    | {
          role: "AUTOCOMPLETE";
          name: `${string}-autocomplete`;
          run: (interaction: AutocompleteInteraction) => unknown;
      };

export type CommandNoRun = Omit<Command, "run">;