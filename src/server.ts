import Fastify from 'fastify';
import cors from '@fastify/cors';
import { config } from './config.js';
import { getPool } from './db/pool.js';
import { runMigrations } from './db/migrate.js';
import healthRoutes from './routes/health.js';
import actorRoutes from './routes/actors.js';
import agentRoutes from './routes/agents.js';
import assignmentRoutes from './routes/assignments.js';
import receiptRoutes from './routes/receipts.js';
import webhookRoutes from './routes/webhooks.js';

async function main() {
  const app = Fastify({ logger: true });

  // CORS
  await app.register(cors, { origin: config.corsOrigin });

  // Run DB migrations
  await runMigrations();

  // Register routes
  await app.register(healthRoutes);
  await app.register(actorRoutes, { prefix: '/api' });
  await app.register(agentRoutes, { prefix: '/api' });
  await app.register(assignmentRoutes, { prefix: '/api' });
  await app.register(receiptRoutes, { prefix: '/api' });
  await app.register(webhookRoutes, { prefix: '/api' });

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
