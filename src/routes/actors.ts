import { FastifyInstance } from 'fastify';
import { createActor, getActorById, listActors, updateActor, type ActorType, type ActorStatus } from '../domain/actor.js';
import { createOwnershipEdge, getOwnedBy, getOwnersOf, removeOwnershipEdge, type OwnershipRole } from '../domain/ownership.js';
import { AppError } from '../lib/errors.js';

export default async function actorRoutes(app: FastifyInstance) {
  // POST /actors — create actor
  app.post('/actors', async (request, reply) => {
    const body = request.body as {
      type: ActorType;
      handle: string;
      display_name: string;
      capabilities?: string[];
      metadata?: Record<string, unknown>;
    };

    if (!body.type || !body.handle || !body.display_name) {
      reply.status(400);
      return { ok: false, error: 'type, handle, and display_name are required' };
    }

    try {
      const actor = await createActor(body);
      reply.status(201);
      return { ok: true, data: actor };
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('duplicate key')) {
        reply.status(409);
        return { ok: false, error: `Handle '${body.handle}' already exists` };
      }
      throw err;
    }
  });

  // GET /actors — list actors
  app.get('/actors', async (request) => {
    const q = request.query as Record<string, string>;
    const result = await listActors({
      type: q.type as ActorType | undefined,
      status: q.status as ActorStatus | undefined,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
    return { ok: true, data: result };
  });

  // GET /actors/:id — get actor
  app.get('/actors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const actor = await getActorById(id);
    if (!actor) {
      reply.status(404);
      return { ok: false, error: 'Actor not found' };
    }
    return { ok: true, data: actor };
  });

  // PATCH /actors/:id — update actor
  app.patch('/actors/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as Partial<{
      display_name: string;
      status: ActorStatus;
      capabilities: string[];
      metadata: Record<string, unknown>;
    }>;

    const actor = await updateActor(id, body);
    if (!actor) {
      reply.status(404);
      return { ok: false, error: 'Actor not found' };
    }
    return { ok: true, data: actor };
  });

  // POST /actors/:ownerId/owns/:subjectId — create ownership edge
  app.post('/actors/:ownerId/owns/:subjectId', async (request, reply) => {
    const { ownerId, subjectId } = request.params as { ownerId: string; subjectId: string };
    const body = request.body as { role?: OwnershipRole };
    const role = body.role ?? 'owner';

    try {
      const edge = await createOwnershipEdge(ownerId, subjectId, role);
      reply.status(201);
      return { ok: true, data: edge };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // GET /actors/:id/owns — list subjects owned by actor
  app.get('/actors/:id/owns', async (request) => {
    const { id } = request.params as { id: string };
    const edges = await getOwnedBy(id);
    return { ok: true, data: edges };
  });

  // GET /actors/:id/owners — list owners of actor
  app.get('/actors/:id/owners', async (request) => {
    const { id } = request.params as { id: string };
    const edges = await getOwnersOf(id);
    return { ok: true, data: edges };
  });

  // DELETE /actors/:ownerId/owns/:subjectId — remove ownership edge
  app.delete('/actors/:ownerId/owns/:subjectId', async (request, reply) => {
    const { ownerId, subjectId } = request.params as { ownerId: string; subjectId: string };
    const q = request.query as { role?: OwnershipRole };
    const role = q.role ?? 'owner';
    const removed = await removeOwnershipEdge(ownerId, subjectId, role);
    if (!removed) {
      reply.status(404);
      return { ok: false, error: 'Ownership edge not found' };
    }
    return { ok: true, data: { removed: true } };
  });
}
