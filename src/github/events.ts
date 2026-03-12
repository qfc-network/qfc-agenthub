import { getActorByHandle } from '../domain/actor.js';
import { createAssignment, listAssignments, updateAssignmentStatus } from '../domain/assignment.js';
import { parseCommand } from './commands.js';
import { postComment } from './client.js';

type IssuePayload = {
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    html_url: string;
    assignee?: { login: string } | null;
  };
  repository: { full_name: string };
  comment?: { body: string; user: { login: string } };
};

/**
 * Handle GitHub webhook events.
 */
export async function handleGithubEvent(event: string, payload: IssuePayload): Promise<void> {
  if (event === 'issues' && payload.action === 'assigned') {
    await handleIssueAssigned(payload);
  }

  if (event === 'issue_comment' && payload.action === 'created' && payload.comment) {
    await handleIssueComment(payload);
  }
}

/**
 * When an issue is assigned, check if the assignee is a registered agent.
 * If so, create an assignment record.
 */
async function handleIssueAssigned(payload: IssuePayload): Promise<void> {
  const assigneeLogin = payload.issue.assignee?.login;
  if (!assigneeLogin) return;

  const agent = await getActorByHandle(assigneeLogin);
  if (!agent || agent.type !== 'agent') return;

  // Check if assignment already exists
  const existing = await listAssignments({
    actor_id: agent.id,
    github_repo: payload.repository.full_name,
  });
  const alreadyAssigned = existing.items.some(
    (a) => a.github_issue_number === payload.issue.number && !['completed', 'failed', 'cancelled'].includes(a.status)
  );
  if (alreadyAssigned) return;

  await createAssignment({
    actor_id: agent.id,
    title: payload.issue.title,
    description: payload.issue.body ?? undefined,
    github_repo: payload.repository.full_name,
    github_issue_number: payload.issue.number,
    github_issue_url: payload.issue.html_url,
  });

  console.log(`[Event] Created assignment for agent '${agent.handle}' on ${payload.repository.full_name}#${payload.issue.number}`);
}

/**
 * Parse comment commands and act on them.
 */
async function handleIssueComment(payload: IssuePayload): Promise<void> {
  const comment = payload.comment;
  if (!comment) return;

  const command = parseCommand(comment.body);
  if (!command) return;

  const repo = payload.repository.full_name;
  const issueNumber = payload.issue.number;

  if (command.type === 'assign-agent') {
    const agent = await getActorByHandle(command.handle);
    if (!agent || agent.type !== 'agent') {
      await postComment(repo, issueNumber, `Agent \`${command.handle}\` not found in the registry.`);
      return;
    }

    await createAssignment({
      actor_id: agent.id,
      title: payload.issue.title,
      description: payload.issue.body ?? undefined,
      github_repo: repo,
      github_issue_number: issueNumber,
      github_issue_url: payload.issue.html_url,
    });

    await postComment(repo, issueNumber,
      `Assigned to agent **${agent.display_name}** (\`${agent.handle}\`). The agent will pick up this task shortly.`
    );
  }

  if (command.type === 'agent-status') {
    const assignments = await listAssignments({ github_repo: repo });
    const current = assignments.items.find(
      (a) => a.github_issue_number === issueNumber && !['completed', 'failed', 'cancelled'].includes(a.status)
    );

    if (!current) {
      await postComment(repo, issueNumber, 'No active agent assignment for this issue.');
    } else {
      await postComment(repo, issueNumber,
        `**Assignment status**: \`${current.status}\`\n**Agent**: actor \`${current.actor_id}\`\n**Created**: ${current.created_at}`
      );
    }
  }

  if (command.type === 'cancel-agent') {
    const assignments = await listAssignments({ github_repo: repo });
    const current = assignments.items.find(
      (a) => a.github_issue_number === issueNumber && !['completed', 'failed', 'cancelled'].includes(a.status)
    );

    if (!current) {
      await postComment(repo, issueNumber, 'No active agent assignment to cancel.');
    } else {
      await updateAssignmentStatus(current.id, 'cancelled');
      await postComment(repo, issueNumber, 'Agent assignment cancelled.');
    }
  }
}
