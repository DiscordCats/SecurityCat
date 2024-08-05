import {
    AutoModerationActionOptions,
    AutoModerationActionType,
    Client,
} from 'discord.js';
import { Hono } from 'hono';
import { authenticate } from '../utils/discord';
import { db } from '../db';
import { servers } from '../schema';
import { eq } from 'drizzle-orm';

// curl -X POST http://localhost:3000/toggle-block-message?serverId=serverid \
//   -H "Authorization: DISCORD_TOKEN" \
//   -H "Content-Type: application/json" \
//   -d '{
//         "serverId": "serveridhere",
//         "ruleId": "automodruleidhere"
//       }'

export default function (app: Hono, client: Client) {
    app.post('/toggle-block-message', async (c) => {
        const auth = await authenticate(c);
        if (!auth) return c.json({ error: 'Unauthorized' }, 401);

        const { ruleId } = await c.req.json();
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

            let blockMessageActionExists = false;
            const newActions: AutoModerationActionOptions[] = rule.actions
                .map((action) => {
                    if (action.type === AutoModerationActionType.BlockMessage) {
                        blockMessageActionExists = true;
                        return null; // Mark for removal
                    }
                    if (
                        action.type ===
                        AutoModerationActionType.SendAlertMessage
                    ) {
                        return {
                            ...action,
                            metadata: {
                                ...action.metadata,
                                channel:
                                    action.metadata.channelId ??
                                    'never gonna give you up',
                            },
                        };
                    }
                    return action;
                })
                .filter(
                    (action) => action !== null,
                ) as AutoModerationActionOptions[]; // Filter out the nulls

            if (!blockMessageActionExists) {
                newActions.push({
                    type: AutoModerationActionType.BlockMessage,
                    metadata: {},
                });
            }

            console.log(
                'Sending JSON to Discord:',
                JSON.stringify(newActions, null, 2),
            );

            await rule.edit({ actions: newActions });

            await db
                .update(servers)
                .set({
                    modules: serverRecord.modules.map((mod) =>
                        mod.id === ruleId
                            ? {
                                  ...mod,
                                  blockMessageEnabled:
                                      !blockMessageActionExists,
                              }
                            : mod,
                    ),
                })
                .where(eq(servers.id, serverId))
                .execute();

            const message = blockMessageActionExists
                ? 'BlockMessage action has been disabled.'
                : 'BlockMessage action has been enabled.';

            return c.json({ success: true, message });
        } catch (err) {
            console.error(
                `Error toggling BlockMessage action for rule ${ruleId}:`,
                err,
            );
            return c.json(
                { error: 'Failed to toggle BlockMessage action' },
                500,
            );
        }
    });
}
