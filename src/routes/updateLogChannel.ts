import {
    AutoModerationActionType,
    Client,
    AutoModerationRuleEditOptions,
    AutoModerationActionMetadataOptions,
} from 'discord.js';
import { Hono } from 'hono';
import { authenticate, fetchGuild, fetchGuildChannel } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

// curl -X POST http://localhost:3000/update-log-channel?serverId=serverid \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{"channel": "channelidhere"}'

export default function (app: Hono, client: Client) {
    app.post('/update-log-channel', async (c) => {
        const auth = await authenticate(c);
        if (!auth) return c.json({ error: 'Unauthorized' }, 401);

        const { channel, module } = (await c.req.json()) as Record<
            string,
            string
        >;
        const serverId = auth;

        if (!channel) {
            return c.json({ error: 'Channel ID is required' }, 400);
        }
        const channelData = await fetchGuildChannel(client, serverId, channel);
        if (!channelData) {
            return c.json({ error: 'Channel not found' }, 404);
        }

        // Fetch the server record from the database
        const serverRecord = await db
            .select()
            .from(servers)
            .where(eq(servers.id, serverId))
            .execute()
            .then((res) => res[0]);

        if (!serverRecord) {
            return c.json({ error: 'Server record not found' }, 404);
        }

        // Get the auto moderation manager
        const autoModManager = (await fetchGuild(client, serverId))
            ?.autoModerationRules;
        if (!autoModManager) {
            return c.json({ error: 'AutoModManager not available' }, 500);
        }

        try {
            const index = serverRecord.modules.findIndex(
                (mod) => mod.name === module,
            );
            serverRecord.modules[index].log = channel;

            await db
                .update(servers)
                .set({ modules: serverRecord.modules })
                .where(eq(servers.id, serverId))
                .execute();

            for (const mod of serverRecord.modules) {
                try {
                    if (!mod.id) continue;
                    const rule = await autoModManager.fetch(mod.id);
                    if (rule) {
                        const existingActions = rule.actions;
                        let actionUpdated = false;

                        const newActions = existingActions.map((action) => {
                            if (
                                action.type ===
                                AutoModerationActionType.SendAlertMessage
                            ) {
                                actionUpdated = true;
                                return {
                                    type: AutoModerationActionType.SendAlertMessage,
                                    metadata: {
                                        channel,
                                    } as AutoModerationActionMetadataOptions,
                                };
                            }
                            return action;
                        });

                        if (!actionUpdated) {
                            newActions.push({
                                type: AutoModerationActionType.SendAlertMessage,
                                metadata: {
                                    channel,
                                } as AutoModerationActionMetadataOptions,
                            });
                        }

                        const editOptions: AutoModerationRuleEditOptions = {
                            actions: newActions,
                        };

                        await rule.edit(editOptions);
                    }
                } catch (err) {
                    console.error(
                        `Error updating rule ${mod.id} with new log channel:`,
                        err,
                    );
                }
            }

            return c.json({
                success: true,
                message: `Auto-mod log channel set to <#${channel}>.`,
            });
        } catch (err) {
            console.error('Error updating log channel:', err);
            return c.json({ error: 'Failed to update log channel' }, 500);
        }
    });
}
