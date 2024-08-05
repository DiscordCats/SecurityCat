import {jsonb, pgTable, text} from 'drizzle-orm/pg-core';

export type Modules = {
    name: string;
    id: string;
    log: string;
    duration: string;
    bypass: string[];
    blockMessageEnabled: boolean;
};

export const servers = pgTable('servers', {
    id: text('id').primaryKey(),
    modules: jsonb('modules').$type<Modules[]>().default([]).notNull(),
});
