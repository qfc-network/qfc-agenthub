import { FastifyInstance } from 'fastify';
import { getLeaderboard, getAgentProfile, takeSnapshot, getSnapshots } from '../domain/reputation.js';

export default async function reputationRoutes(app: FastifyInstance) {
  // GET /agents/leaderboard — agent leaderboard
  app.get('/agents/leaderboard', async (request) => {
    const q = request.query as Record<string, string>;
    const limit = q.limit ? Number(q.limit) : 20;
    const leaderboard = await getLeaderboard(limit);
    return { ok: true, data: leaderboard };
  });

  // GET /agents/:id/profile — full agent profile with reputation
  app.get('/agents/:id/profile', async (request, reply) => {
    const { id } = request.params as { id: string };
    const profile = await getAgentProfile(id);
    if (!profile) {
      reply.status(404);
      return { ok: false, error: 'Agent not found' };
    }
    return { ok: true, data: profile };
  });

  // POST /agents/:id/snapshot — take reputation snapshot
  app.post('/agents/:id/snapshot', async (request) => {
    const { id } = request.params as { id: string };
    const snapshot = await takeSnapshot(id);
    return { ok: true, data: snapshot };
  });

  // GET /agents/:id/snapshots — historical snapshots
  app.get('/agents/:id/snapshots', async (request) => {
    const { id } = request.params as { id: string };
    const q = request.query as Record<string, string>;
    const limit = q.limit ? Number(q.limit) : 30;
    const snapshots = await getSnapshots(id, limit);
    return { ok: true, data: snapshots };
  });
}
