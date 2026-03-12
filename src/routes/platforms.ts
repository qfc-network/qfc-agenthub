import { FastifyInstance } from 'fastify';
import { createCredential, getCredential, listCredentials, deleteCredential, type PlatformType } from '../domain/platform.js';

export default async function platformRoutes(app: FastifyInstance) {
  // POST /actors/:id/platforms — add/update platform credential
  app.post('/actors/:id/platforms', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      platform: PlatformType;
      platform_user_id?: string;
      access_token?: string;
      refresh_token?: string;
      webhook_secret?: string;
      base_url?: string;
      metadata?: Record<string, unknown>;
    };

    if (!body.platform) {
      reply.status(400);
      return { ok: false, error: 'platform is required' };
    }

    const credential = await createCredential({ ...body, actor_id: id });
    reply.status(201);
    return { ok: true, data: credential };
  });

  // GET /actors/:id/platforms — list platform credentials
  app.get('/actors/:id/platforms', async (request) => {
    const { id } = request.params as { id: string };
    const credentials = await listCredentials(id);
    // Strip sensitive fields
    const safe = credentials.map(({ access_token: _a, refresh_token: _r, webhook_secret: _w, ...rest }) => rest);
    return { ok: true, data: safe };
  });

  // GET /actors/:id/platforms/:platform — get specific credential
  app.get('/actors/:id/platforms/:platform', async (request, reply) => {
    const { id, platform } = request.params as { id: string; platform: PlatformType };
    const credential = await getCredential(id, platform);
    if (!credential) {
      reply.status(404);
      return { ok: false, error: 'Platform credential not found' };
    }
    // Strip sensitive fields
    const { access_token: _a, refresh_token: _r, webhook_secret: _w, ...safe } = credential;
    return { ok: true, data: safe };
  });

  // DELETE /actors/:id/platforms/:platform — remove credential
  app.delete('/actors/:id/platforms/:platform', async (request, reply) => {
    const { id, platform } = request.params as { id: string; platform: PlatformType };
    const removed = await deleteCredential(id, platform);
    if (!removed) {
      reply.status(404);
      return { ok: false, error: 'Platform credential not found' };
    }
    return { ok: true, data: { removed: true } };
  });
}
