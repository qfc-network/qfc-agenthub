import { FastifyInstance } from 'fastify';
import { createAssignment, getAssignmentById, listAssignments, updateAssignmentStatus, type AssignmentStatus } from '../domain/assignment.js';
import { AppError } from '../lib/errors.js';

export default async function assignmentRoutes(app: FastifyInstance) {
  // POST /assignments — create assignment
  app.post('/assignments', async (request, reply) => {
    const body = request.body as {
      actor_id: string;
      title: string;
      description?: string;
      github_repo?: string;
      github_issue_number?: number;
      github_issue_url?: string;
      priority?: number;
      metadata?: Record<string, unknown>;
    };

    if (!body.actor_id || !body.title) {
      reply.status(400);
      return { ok: false, error: 'actor_id and title are required' };
    }

    const assignment = await createAssignment(body);
    reply.status(201);
    return { ok: true, data: assignment };
  });

  // GET /assignments — list assignments
  app.get('/assignments', async (request) => {
    const q = request.query as Record<string, string>;
    const result = await listAssignments({
      actor_id: q.actor_id,
      status: q.status as AssignmentStatus | undefined,
      github_repo: q.github_repo,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
    return { ok: true, data: result };
  });

  // GET /assignments/:id — get assignment
  app.get('/assignments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const assignment = await getAssignmentById(id);
    if (!assignment) {
      reply.status(404);
      return { ok: false, error: 'Assignment not found' };
    }
    return { ok: true, data: assignment };
  });

  // PATCH /assignments/:id — update assignment status
  app.patch('/assignments/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { status: AssignmentStatus };

    if (!body.status) {
      reply.status(400);
      return { ok: false, error: 'status is required' };
    }

    try {
      const assignment = await updateAssignmentStatus(id, body.status);
      if (!assignment) {
        reply.status(404);
        return { ok: false, error: 'Assignment not found' };
      }
      return { ok: true, data: assignment };
    } catch (err) {
      if (err instanceof AppError) {
        reply.status(err.statusCode);
        return { ok: false, error: err.message };
      }
      throw err;
    }
  });
}
