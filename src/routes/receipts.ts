import { FastifyInstance } from 'fastify';
import { createReceipt, getReceiptById, listReceipts, setGithubCommentId, type CreateReceiptInput } from '../domain/receipt.js';
import { getAssignmentById } from '../domain/assignment.js';
import { postReceiptComment } from '../github/client.js';

export default async function receiptRoutes(app: FastifyInstance) {
  // POST /receipts — create receipt and optionally write back to GitHub
  app.post('/receipts', async (request, reply) => {
    const body = request.body as CreateReceiptInput;

    if (!body.run_id || !body.assignment_id || !body.actor_id || !body.status) {
      reply.status(400);
      return { ok: false, error: 'run_id, assignment_id, actor_id, and status are required' };
    }

    const receipt = await createReceipt(body);

    // Write back to GitHub if the assignment has a GitHub issue
    const assignment = await getAssignmentById(body.assignment_id);
    if (assignment?.github_repo && assignment.github_issue_number) {
      try {
        const commentId = await postReceiptComment(
          assignment.github_repo,
          assignment.github_issue_number,
          receipt
        );
        if (commentId) {
          await setGithubCommentId(receipt.id, commentId);
          receipt.github_comment_id = commentId;
        }
      } catch (err) {
        console.warn('Failed to post receipt to GitHub:', err);
      }
    }

    reply.status(201);
    return { ok: true, data: receipt };
  });

  // GET /receipts — list receipts
  app.get('/receipts', async (request) => {
    const q = request.query as Record<string, string>;
    const result = await listReceipts({
      assignment_id: q.assignment_id,
      actor_id: q.actor_id,
      run_id: q.run_id,
      limit: q.limit ? Number(q.limit) : undefined,
      offset: q.offset ? Number(q.offset) : undefined,
    });
    return { ok: true, data: result };
  });

  // GET /receipts/:id — get receipt
  app.get('/receipts/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const receipt = await getReceiptById(id);
    if (!receipt) {
      reply.status(404);
      return { ok: false, error: 'Receipt not found' };
    }
    return { ok: true, data: receipt };
  });
}
