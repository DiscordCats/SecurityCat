import { boolean, jsonb, pgTable, serial, text } from 'drizzle-orm/pg-core';

export type Modules = {
    enabled: boolean; // whether the module is enabled
    name: string; // name of the module
    id: string | null; // id of the automod rule, if any
    log: string | null; // id of the log channel, if any
    duration: string | null; // duration of the timeout, null if no timeout.
    bypass: {
        words: string[]; // words that bypass the module
        roles: string[]; // role ids that bypass the module
        channels: string[]; // channel ids that bypass the module
        // should all be empty arrays if none
    };
    blockMessageEnabled: boolean; // whether the message should be blocked
};

export const servers = pgTable('servers', {
    id: text('id').primaryKey(),
    modules: jsonb('modules').array().$type<Modules[]>().notNull(),
});

// unused
export const modules = pgTable('modules', {
    id: serial('id').primaryKey(),
    enabled: boolean('enabled').default(false).notNull(),
    name: text('name').notNull(),
    amId: text('am_id'),
    log: text('log'),
    duration: text('duration'),
    bypass: jsonb('bypass')
        .default({ words: [], roles: [], channels: [] })
        .$type<{
            words: string[];
            roles: string[];
            channels: string[];
        }>()
        .notNull(),
    blockMessageEnabled: boolean('block_message_enabled').notNull(),
});
