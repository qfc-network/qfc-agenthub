import { getPool } from '../db/pool.js';
import { badRequest, notFound } from '../lib/errors.js';
import { getOwnedBy } from './ownership.js';
import { getAssignmentById, type Assignment } from './assignment.js';
import { getActorById } from './actor.js';

const MAX_DEPTH_DEFAULT = 5;

/**
 * Check if delegator owns the delegate (directly or transitively).
 */
async function ownsAgent(ownerId: string, agentId: string): Promise<boolean> {
  const edges = await getOwnedBy(ownerId);
  if (edges.some((e) => e.subject_id === agentId)) return true;
  // Check transitive ownership
  for (const edge of edges) {
    if (await ownsAgent(edge.subject_id, agentId)) return true;
  }
  return false;
}

/**
 * Delegate an assignment to a sub-agent.
 * Creates a child assignment linked to the parent.
 */
export async function delegateAssignment(
  parentAssignmentId: string,
  delegateActorId: string,
  title?: string,
  description?: string
): Promise<Assignment> {
  const pool = getPool();
  const parent = await getAssignmentById(parentAssignmentId);
  if (!parent) throw notFound('Parent assignment not found');

  if (!['accepted', 'running'].includes(parent.status)) {
    throw badRequest(`Cannot delegate from assignment in '${parent.status}' status`);
  }

  // Check delegation depth
  const parentActor = await getActorById(parent.actor_id);
  const maxDepth = (parentActor?.max_delegation_depth as number | undefined) ?? MAX_DEPTH_DEFAULT;
  const newDepth = (parent.delegation_depth ?? 0) + 1;
  if (newDepth > maxDepth) {
    throw badRequest(`Delegation depth limit exceeded (max: ${maxDepth})`);
  }

  // Check ownership: the current assignee must own the delegate
  const canDelegate = await ownsAgent(parent.actor_id, delegateActorId);
  if (!canDelegate) {
    throw badRequest('Delegator does not own the target agent');
  }

  const { rows } = await pool.query(
    `INSERT INTO assignments (actor_id, title, description, github_repo, github_issue_number, github_issue_url, parent_id, delegation_depth, delegated_by, priority, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [
      delegateActorId,
      title ?? parent.title,
      description ?? parent.description,
      parent.github_repo,
      parent.github_issue_number,
      parent.github_issue_url,
      parentAssignmentId,
      newDepth,
      parent.actor_id,
      parent.priority,
      parent.metadata,
    ]
  );
  return rows[0];
}

/**
 * Escalate a failed/stuck assignment to the human root owner.
 */
export async function escalateAssignment(
  assignmentId: string,
  reason: string
): Promise<Assignment> {
  const pool = getPool();
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) throw notFound('Assignment not found');

  // Find human root owner by walking ownership graph up
  const humanOwner = await findHumanRoot(assignment.actor_id);
  if (!humanOwner) throw badRequest('No human owner found for escalation');

  const { rows } = await pool.query(
    `UPDATE assignments SET escalated_to = $1, escalation_reason = $2, updated_at = now() WHERE id = $3 RETURNING *`,
    [humanOwner, reason, assignmentId]
  );
  return rows[0];
}

/**
 * Walk the ownership graph upward to find a human root.
 */
async function findHumanRoot(actorId: string, visited = new Set<string>()): Promise<string | null> {
  if (visited.has(actorId)) return null;
  visited.add(actorId);

  const actor = await getActorById(actorId);
  if (!actor) return null;
  if (actor.type === 'human') return actor.id;

  const pool = getPool();
  const { rows } = await pool.query(
    'SELECT owner_id FROM ownership_edges WHERE subject_id = $1',
    [actorId]
  );

  for (const row of rows) {
    const result = await findHumanRoot(row.owner_id, visited);
    if (result) return result;
  }
  return null;
}

/**
 * Get the delegation tree for an assignment.
 */
export async function getDelegationTree(assignmentId: string): Promise<DelegationNode | null> {
  const assignment = await getAssignmentById(assignmentId);
  if (!assignment) return null;

  const pool = getPool();
  const { rows: children } = await pool.query(
    'SELECT id FROM assignments WHERE parent_id = $1 ORDER BY created_at',
    [assignmentId]
  );

  const childNodes: DelegationNode[] = [];
  for (const child of children) {
    const node = await getDelegationTree(child.id);
    if (node) childNodes.push(node);
  }

  return {
    assignment,
    children: childNodes,
  };
}

export type DelegationNode = {
  assignment: Assignment;
  children: DelegationNode[];
};
