import { AutoModerationActionType, Client } from 'discord.js';
import { Hono } from 'hono';
import { authenticate, fetchGuild } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

// curl -X POST http://localhost:3000/update-duration \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "module": "moduleName",
//         "duration": "durationInSeconds"
//       }'

export default function (app: Hono, client: Client) {
    app.post('/update-duration', async (c) => {
        try {
            const auth = await authenticate(c);
            if (!auth) return c.json({ error: 'Unauthorized' }, 401);

            const { module: moduleName, duration } = (await c.req.json()) as {
                module: string;
                duration: string;
            };
            const serverId: string = auth;

            const serverRecord = await db
                .select()
                .from(servers)
                .where(eq(servers.id, serverId))
                .execute()
                .then((res) => res[0]);

            if (!serverRecord) {
                return c.json({ error: 'Server record not found' }, 404);
            }

            const moduleIndex = serverRecord.modules.findIndex(
                (mod) => mod.name === moduleName,
            );
            if (moduleIndex === -1) {
                return c.json(
                    { error: `Module with name ${moduleName} not found` },
                    404,
                );
            }

            serverRecord.modules[moduleIndex].duration = duration;
            await db
                .update(servers)
                .set({ modules: serverRecord.modules })
                .where(eq(servers.id, serverId))
                .execute();

            const autoModManager = (await fetchGuild(client, serverId))
                ?.autoModerationRules;
            if (autoModManager) {
                const mod = serverRecord.modules[moduleIndex];
                if (mod.id) {
                    const rule = await autoModManager
                        .fetch(mod.id)
                        .catch(() => null);
                    if (rule) {
                        let timeoutActionExists = false;

                        const newActions = rule.actions.map((action) => {
                            if (
                                action.type ===
                                AutoModerationActionType.SendAlertMessage
                            ) {
                                return {
                                    ...action,
                                    metadata: {
                                        channel:
                                            action.metadata.channelId ??
                                            "heyyy you'll never see this",
                                    },
                                };
                            }

                            if (
                                action.type === AutoModerationActionType.Timeout
                            ) {
                                timeoutActionExists = true;
                                return {
                                    type: AutoModerationActionType.Timeout,
                                    metadata: {
                                        durationSeconds: parseInt(duration),
                                    },
                                };
                            }
                            return action;
                        });

                        if (!timeoutActionExists) {
                            newActions.push({
                                type: AutoModerationActionType.Timeout,
                                metadata: {
                                    durationSeconds: parseInt(duration),
                                },
                            });
                        }

                        await rule.edit({ actions: newActions }).catch(() => {
                            // automod rule update is optional
                        });
                    }
                }
            }

            return c.json({
                success: true,
                message: 'Duration updated successfully.',
            });
        } catch (err) {
            console.error(`Error updating module with new duration:`, err);
            return c.json({ error: 'Failed to update duration' }, 500);
        }
    });
}
