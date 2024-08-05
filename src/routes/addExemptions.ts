import { AutoModerationActionType, Client, Snowflake } from 'discord.js';
import { Context, Hono } from 'hono';
import { authenticate } from '../utils/discord';
import { db } from '../db';
import {Modules, servers} from '../schema';
import { eq } from 'drizzle-orm';

// Adding both exempt roles and channels
// curl -X POST http://localhost:3000/add-exemptions?serverId=serverid \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "ruleId": "ruleidhere",
//         "exemptRoles": ["role1", "role2"],
//         "exemptChannels": ["channel1", "channel2"]
//       }'

// Adding only exempt roles
// curl -X POST http://localhost:3000/add-exemptions \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "ruleId": "ruleidhere",
//         "exemptRoles": ["role1", "role2"]
//       }'

// Adding only exempt channels
// curl -X POST http://localhost:3000/add-exemptions \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "ruleId": "ruleidhere",
//         "exemptChannels": ["channel1", "channel2"]
//       }'

interface ExemptionPayload {
    ruleId: string;
    exemptRoles?: Snowflake[];
    exemptChannels?: Snowflake[];
}

module.exports = function (app: Hono, client: Client) {
    app.post('/add-exemptions', async (c: Context) => {
        try {
            const auth = await authenticate(c);
            if (!auth) return c.json({ error: 'Unauthorized' }, 401);

            const payload: ExemptionPayload = await c.req.json();
            const { ruleId, exemptRoles, exemptChannels } = payload;
            const serverId: string = auth;

            if (!ruleId) {
                return c.json({ error: 'Invalid request payload' }, 400);
            }

            const serverRecord = await db
                .select()
                .from(servers)
                .where(eq(servers.id, serverId))
                .execute()
                .then((res) => res[0]);

            if (!serverRecord) {
                return c.json({ error: 'Server record not found' }, 404);
            }

            const autoModManager =
                client.guilds.cache.get(serverId)?.autoModerationRules;
            if (!autoModManager) {
                return c.json({ error: 'AutoModManager not available' }, 500);
            }

            const rule = await autoModManager.fetch(ruleId);
            if (!rule) {
                return c.json({ error: 'Rule not found' }, 404);
            }

            // init arrays for exempt roles and channels
            let updatedExemptRoles: Snowflake[] = Array.isArray(
                rule.exemptRoles,
            )
                ? [...rule.exemptRoles]
                : [];
            let updatedExemptChannels: Snowflake[] = Array.isArray(
                rule.exemptChannels,
            )
                ? [...rule.exemptChannels]
                : [];

            // add exempt roles if provided
            if (Array.isArray(exemptRoles)) {
                exemptRoles.forEach((roleId) => {
                    if (!updatedExemptRoles.includes(roleId)) {
                        updatedExemptRoles.push(roleId);
                    }
                });
            }

            // add exempt channels if provided
            if (Array.isArray(exemptChannels)) {
                exemptChannels.forEach((channelId) => {
                    if (!updatedExemptChannels.includes(channelId)) {
                        updatedExemptChannels.push(channelId);
                    }
                });
            }

            // discord limits for exempt roles and channels to 20 and 50 respectively
            if (updatedExemptRoles.length > 20) updatedExemptRoles.length = 20;
            if (updatedExemptChannels.length > 50)
                updatedExemptChannels.length = 50;

            // make sure format is valid before sending
            await rule.edit({
                exemptRoles: updatedExemptRoles,
                exemptChannels: updatedExemptChannels,
            });

            const updatedModules = serverRecord.modules.map((mod) =>
                mod.id === ruleId
                    ? {
                          ...mod,
                          bypass: {
                              roles: updatedExemptRoles,
                              channels: updatedExemptChannels,
                              words: [...rule.triggerMetadata.allowList],
                          },
                      }
                    : mod,
            );

            await db
                .update(servers)
                .set({ modules: updatedModules })
                .where(eq(servers.id, serverId))
                .execute();

            return c.json({
                success: true,
                message: 'Exemptions added successfully.',
            });
        } catch (err) {
            console.error('Error adding exemptions:', err);
            return c.json({ error: 'Failed to add exemptions' }, 500);
        }
    });
};
