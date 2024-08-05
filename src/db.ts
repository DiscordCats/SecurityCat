import { Client } from 'pg';
import * as schema from './schema';
import { NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import {Modules} from "./schema";
import {eq} from "drizzle-orm";

const client = new Client({ connectionString: process.env.DB_URL });

export let db: NodePgDatabase<typeof schema>;

export async function init() {
    await client.connect();
    db = drizzle(client, { schema });
}

const serverModules = new Map<string, Modules[]>()

export async function getServerModules(id: string){
    if(serverModules.has(id)){
        return serverModules.get(id) || []
    }
    const modules = await db
        .select({ modules: schema.servers.modules })
        .from(schema.servers)
        .where(eq(schema.servers.id, id))
        .execute();
    serverModules.set(id, modules[0]?.modules || [])
    return modules[0]?.modules || []
}