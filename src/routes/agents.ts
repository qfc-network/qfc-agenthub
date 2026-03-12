import { FastifyInstance } from 'fastify';
import { createActor, getActorByHandle } from '../domain/actor.js';
import { createOwnershipEdge } from '../domain/ownership.js';
import { listAssignments } from '../domain/assignment.js';
import { AppError } from '../lib/errors.js';

export default async function agentRoutes(app: FastifyInstance) {
  // POST /agents/register — register agent + create ownership edge in one call
  app.post('/agents/register', async (request, reply) => {
    const body = request.body as {
      handle: string;
      display_name: string;
      owner_id: string;
      capabilities?: string[];
      metadata?: Record<string, unknown>;
    };

    if (!body.handle || !body.display_name || !body.owner_id) {
      reply.status(400);
      return { ok: false, error: 'handle, display_name, and owner_id are required' };
    }

    try {
      const agent = await createActor({
        type: 'agent',
        handle: body.handle,
        display_name: body.display_name,
        capabilities: body.capabilities,
        metadata: body.metadata,
      });

      const edge = await createOwnershipEdge(body.owner_id, agent.id, 'owner');

      reply.status(201);
      return { ok: true, data: { agent, ownership: edge } };
    } catch (err: unknown) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      if (err instanceof Error && err.message.includes('duplicate key')) {
        reply.status(409);
        return { ok: false, error: `Handle '${body.handle}' already exists` };
      }
      throw err;
    }
  });

  // GET /agents/:idOrHandle/inbox — pending assignments for this agent
  app.get('/agents/:idOrHandle/inbox', async (request, reply) => {
    const { idOrHandle } = request.params as { idOrHandle: string };

    // Try as handle first, then as UUID
    let actorId = idOrHandle;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrHandle);
    if (!isUuid) {
      const actor = await getActorByHandle(idOrHandle);
      if (!actor) {
        reply.status(404);
        return { ok: false, error: 'Agent not found' };
      }
      actorId = actor.id;
    }

    const result = await listAssignments({ actor_id: actorId, status: 'pending' });
    return { ok: true, data: result };
  });
}
