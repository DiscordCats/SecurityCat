import {pgTable, serial, varchar, text, json, PgArray, integer} from 'drizzle-orm/pg-core'

export const servers = pgTable('servers', {
    id: text('id').primaryKey(),
    modules: text('modules').array(),
    automod_ids: text('automod_ids').array(),
    automod_channel: text('automod_channel').notNull(),
    extras: integer('extras').references(() => extraRules.id)
});


export const extraRules = pgTable('extra_rules', {
    id: serial('id').primaryKey(),
    words: text('words').array(),
    regex: text('regex').array(),
    allowed: text('allowed').array(),
})