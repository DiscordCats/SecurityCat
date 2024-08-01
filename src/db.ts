import { Client } from 'pg'
import * as schema from './schema'
import { NodePgDatabase, drizzle } from "drizzle-orm/node-postgres";

const client = new Client({ connectionString: process.env.DB_URL });

export let db: NodePgDatabase<typeof schema>;

export async function init() {
    await client.connect();
    db = drizzle(client, { schema })
}