import { FastifyInstance } from 'fastify';
import { getPool } from '../db/pool.js';

export default async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async () => {
    const pool = getPool();
    try {
      await pool.query('SELECT 1');
      return { ok: true, data: { status: 'healthy' } };
    } catch {
      return { ok: false, error: 'Database unreachable' };
    }
  });
}
