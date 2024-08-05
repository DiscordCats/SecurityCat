import { AutoModerationActionType, Client } from 'discord.js';
import { Hono } from 'hono';
import { authenticate } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

// curl -X POST http://localhost:3000/update-duration?serverId=serverid \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "serverId": "serveridhere",
//         "ruleId": "exampleid",
//         "duration": durationInSeconds
//       }'

export default function (app: Hono, client: Client) {
    app.post('/update-duration', async (c) => {
        const auth = await authenticate(c);
        if (!auth) return c.json({ error: 'Unauthorized' }, 401);

        const { ruleId, duration } = await c.req.json();
        const serverId = auth;

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

        try {
            const rule = await autoModManager.fetch(ruleId);
            if (!rule) {
                return c.json({ error: 'Rule not found' }, 404);
            }

            let timeoutActionExists = false;

            const newActions = rule.actions.map((action) => {
                if (action.type === AutoModerationActionType.SendAlertMessage) {
                    return {
                        ...action,
                        metadata: {
                            channel:
                                action.metadata.channelId ??
                                "heyyy you'll never see this",
                        },
                    };
                }

                if (action.type === AutoModerationActionType.Timeout) {
                    timeoutActionExists = true;
                    return {
                        type: AutoModerationActionType.Timeout,
                        metadata: { durationSeconds: duration },
                    };
                }
                return action;
            });

            if (!timeoutActionExists) {
                newActions.push({
                    type: AutoModerationActionType.Timeout,
                    metadata: { durationSeconds: duration },
                });
            }

            await rule.edit({ actions: newActions });

            await db
                .update(servers)
                .set({
                    modules: serverRecord.modules.map((mod) =>
                        mod.id === ruleId
                            ? { ...mod, duration: String(duration) }
                            : mod,
                    ),
                })
                .where(eq(servers.id, serverId))
                .execute();

            return c.json({
                success: true,
                message: 'Duration updated successfully.',
            });
        } catch (err) {
            console.error(
                `Error updating rule ${ruleId} with new duration:`,
                err,
            );
            return c.json({ error: 'Failed to update duration' }, 500);
        }
    });
}
