import { FastifyInstance } from 'fastify';
import {
  addCapabilityLabel, removeCapabilityLabel, getCapabilityLabels,
  createRoutingRule, listRoutingRules, deleteRoutingRule,
  findBestAgent, updateAvailability,
} from '../domain/routing.js';
import { createAssignment } from '../domain/assignment.js';
import { getActorById } from '../domain/actor.js';

export default async function routingRoutes(app: FastifyInstance) {
  // --- Capability Labels ---

  // POST /agents/:id/capabilities — add capability label
  app.post('/agents/:id/capabilities', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { label: string; weight?: number };
    if (!body.label) {
      reply.status(400);
      return { ok: false, error: 'label is required' };
    }
    const label = await addCapabilityLabel(id, body.label, body.weight);
    reply.status(201);
    return { ok: true, data: label };
  });

  // GET /agents/:id/capabilities — list capability labels
  app.get('/agents/:id/capabilities', async (request) => {
    const { id } = request.params as { id: string };
    const labels = await getCapabilityLabels(id);
    return { ok: true, data: labels };
  });

  // DELETE /agents/:id/capabilities/:label — remove capability label
  app.delete('/agents/:id/capabilities/:label', async (request, reply) => {
    const { id, label } = request.params as { id: string; label: string };
    const removed = await removeCapabilityLabel(id, label);
    if (!removed) {
      reply.status(404);
      return { ok: false, error: 'Capability label not found' };
    }
    return { ok: true, data: { removed: true } };
  });

  // --- Routing Rules ---

  // POST /routing/rules — create routing rule
  app.post('/routing/rules', async (request, reply) => {
    const body = request.body as { github_label: string; capability: string; priority_boost?: number };
    if (!body.github_label || !body.capability) {
      reply.status(400);
      return { ok: false, error: 'github_label and capability are required' };
    }
    const rule = await createRoutingRule(body.github_label, body.capability, body.priority_boost);
    reply.status(201);
    return { ok: true, data: rule };
  });

  // GET /routing/rules — list routing rules
  app.get('/routing/rules', async () => {
    const rules = await listRoutingRules();
    return { ok: true, data: rules };
  });

  // DELETE /routing/rules/:id — delete routing rule
  app.delete('/routing/rules/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const removed = await deleteRoutingRule(id);
    if (!removed) {
      reply.status(404);
      return { ok: false, error: 'Routing rule not found' };
    }
    return { ok: true, data: { removed: true } };
  });

  // --- Auto-assign ---

  // POST /assignments/auto-assign — find best agent and create assignment
  app.post('/assignments/auto-assign', async (request, reply) => {
    const body = request.body as {
      labels: string[];
      title: string;
      description?: string;
      github_repo?: string;
      github_issue_number?: number;
      github_issue_url?: string;
    };

    if (!body.labels || body.labels.length === 0 || !body.title) {
      reply.status(400);
      return { ok: false, error: 'labels and title are required' };
    }

    const candidate = await findBestAgent(body.labels);
    if (!candidate) {
      reply.status(404);
      return { ok: false, error: 'No matching agent found' };
    }

    const assignment = await createAssignment({
      actor_id: candidate.actor_id,
      title: body.title,
      description: body.description,
      github_repo: body.github_repo,
      github_issue_number: body.github_issue_number,
      github_issue_url: body.github_issue_url,
    });

    reply.status(201);
    return {
      ok: true,
      data: {
        assignment,
        agent: {
          actor_id: candidate.actor_id,
          handle: candidate.handle,
          display_name: candidate.display_name,
          match_score: candidate.match_score,
        },
      },
    };
  });

  // --- Agent Availability ---

  // PATCH /agents/:id/availability — update availability
  app.patch('/agents/:id/availability', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = request.body as { availability: 'online' | 'busy' | 'offline' };
    if (!body.availability || !['online', 'busy', 'offline'].includes(body.availability)) {
      reply.status(400);
      return { ok: false, error: 'availability must be online, busy, or offline' };
    }
    const actor = await getActorById(id);
    if (!actor) {
      reply.status(404);
      return { ok: false, error: 'Agent not found' };
    }
    await updateAvailability(id, body.availability);
    return { ok: true, data: { id, availability: body.availability } };
  });
}
