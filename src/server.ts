import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { config } from './config.js';
import { getPool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import healthRoutes from './routes/health.js';
import actorRoutes from './routes/actors.js';
import agentRoutes from './routes/agents.js';
import assignmentRoutes from './routes/assignments.js';
import receiptRoutes from './routes/receipts.js';
import webhookRoutes from './routes/webhooks.js';
import delegationRoutes from './routes/delegations.js';
import routingRoutes from './routes/routing.js';
import nftRoutes from './routes/nfts.js';
import reputationRoutes from './routes/reputation.js';
import platformRoutes from './routes/platforms.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const app = Fastify({ logger: true });

  // CORS
  await app.register(cors, { origin: config.corsOrigin });

  // Run DB migrations
  await runMigrations();

  // Register API routes
  await app.register(healthRoutes);
  await app.register(actorRoutes, { prefix: '/api' });
  await app.register(agentRoutes, { prefix: '/api' });
  await app.register(assignmentRoutes, { prefix: '/api' });
  await app.register(receiptRoutes, { prefix: '/api' });
  await app.register(webhookRoutes, { prefix: '/api' });
  await app.register(delegationRoutes, { prefix: '/api' });
  await app.register(routingRoutes, { prefix: '/api' });
  await app.register(nftRoutes, { prefix: '/api' });
  await app.register(reputationRoutes, { prefix: '/api' });
  await app.register(platformRoutes, { prefix: '/api' });

  // Serve frontend static files
  const webDist = path.join(__dirname, '..', 'web', 'dist');
  if (fs.existsSync(webDist)) {
    await app.register(fastifyStatic, {
      root: webDist,
      prefix: '/',
      decorateReply: false,
      wildcard: false,
    });

    // SPA fallback: non-API GET requests serve index.html
    app.setNotFoundHandler(async (request, reply) => {
      if (request.method === 'GET' && !request.url.startsWith('/api/') && !request.url.startsWith('/health')) {
        return reply.sendFile('index.html', webDist);
      }
      reply.status(404);
      return { ok: false, error: 'Not found' };
    });
  }

  // Start server
  const address = await app.listen({ port: config.port, host: config.host });
  console.log(`[AgentHub] Server listening on ${address}`);

  // Graceful shutdown
  const shutdown = async () => {
    console.log('[AgentHub] Shutting down...');
    await app.close();
    const pool = getPool();
    await pool.end();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[AgentHub] Failed to start:', err);
  process.exit(1);
});
