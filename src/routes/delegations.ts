import { FastifyInstance } from 'fastify';
import { delegateAssignment, escalateAssignment, getDelegationTree } from '../domain/delegation.js';
import { AppError } from '../lib/errors.js';

export default async function delegationRoutes(app: FastifyInstance) {
  // POST /assignments/:id/delegate — delegate to a sub-agent
  app.post('/assignments/:id/delegate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as {
      delegate_actor_id: string;
      title?: string;
      description?: string;
    };

    if (!body.delegate_actor_id) {
      reply.status(400);
      return { ok: false, error: 'delegate_actor_id is required' };
    }

    try {
      const child = await delegateAssignment(id, body.delegate_actor_id, body.title, body.description);
      reply.status(201);
      return { ok: true, data: child };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // POST /assignments/:id/escalate — escalate to human owner
  app.post('/assignments/:id/escalate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { reason: string };

    if (!body.reason) {
      reply.status(400);
      return { ok: false, error: 'reason is required' };
    }

    try {
      const updated = await escalateAssignment(id, body.reason);
      return { ok: true, data: updated };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });

  // GET /assignments/:id/tree — delegation tree
  app.get('/assignments/:id/tree', async (request, reply) => {
    const { id } = request.params as { id: string };
    const tree = await getDelegationTree(id);
    if (!tree) {
      reply.status(404);
      return { ok: false, error: 'Assignment not found' };
    }
    return { ok: true, data: tree };
  });
}
