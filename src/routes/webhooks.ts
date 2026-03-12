import { FastifyInstance } from 'fastify';
import { verifyWebhookSignature } from '../github/verify.js';
import { handleGithubEvent } from '../github/events.js';
import { config } from '../config.js';

export default async function webhookRoutes(app: FastifyInstance) {
  // POST /webhooks/github — receive GitHub webhook events
  app.post('/webhooks/github', {
    config: { rawBody: true },
  }, async (request, reply) => {
    const signature = request.headers['x-hub-signature-256'] as string | undefined;
    const event = request.headers['x-github-event'] as string | undefined;

    if (!event) {
      reply.status(400);
      return { ok: false, error: 'Missing X-GitHub-Event header' };
    }

    // Verify signature if secret is configured
    if (config.githubWebhookSecret) {
      const rawBody = JSON.stringify(request.body);
      if (!signature || !verifyWebhookSignature(rawBody, signature, config.githubWebhookSecret)) {
        reply.status(401);
        return { ok: false, error: 'Invalid webhook signature' };
      }
    }

    // Handle the event asynchronously — respond immediately
    const payload = request.body as Record<string, unknown>;
    console.log(`[Webhook] Received ${event}.${payload.action ?? ''}`);

    // Fire and forget — don't block the webhook response
    handleGithubEvent(event, payload as any).catch((err) => {
      console.error(`[Webhook] Error handling ${event}:`, err);
    });

    return { ok: true, data: { event, action: payload.action } };
  });
}
