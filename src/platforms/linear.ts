import type { PlatformBridge, PlatformCredential, PlatformIssue } from '../domain/platform.js';
import { getActorByHandle } from '../domain/actor.js';
import { createAssignment } from '../domain/assignment.js';

export class LinearBridge implements PlatformBridge {
  platform = 'linear' as const;

  async handleWebhook(_headers: Record<string, string>, body: unknown): Promise<void> {
    const payload = body as LinearWebhookPayload;

    // Handle issue assignment
    if (payload.type === 'Issue' && payload.action === 'update') {
      await this.handleIssueUpdate(payload);
    }

    // Handle comment creation
    if (payload.type === 'Comment' && payload.action === 'create') {
      await this.handleCommentCreate(payload);
    }
  }

  private async handleIssueUpdate(payload: LinearWebhookPayload): Promise<void> {
    const data = payload.data;
    if (!data?.assignee?.name) return;

    // Check if assignee is a registered agent
    const agent = await getActorByHandle(data.assignee.name);
    if (!agent || agent.type !== 'agent') return;

    await createAssignment({
      actor_id: agent.id,
      title: data.title ?? 'Linear Issue',
      description: data.description ?? undefined,
      github_issue_url: data.url,
    });
  }

  private async handleCommentCreate(payload: LinearWebhookPayload): Promise<void> {
    const data = payload.data;
    if (!data?.body) return;

    const match = data.body.match(/^\/assign-agent\s+(\S+)/m);
    if (!match) return;

    const handle = match[1];
    const agent = await getActorByHandle(handle);
    if (!agent || agent.type !== 'agent') return;

    const issue = data.issue;
    if (!issue) return;

    await createAssignment({
      actor_id: agent.id,
      title: issue.title ?? 'Linear Issue',
      description: issue.description ?? undefined,
      github_issue_url: issue.url,
    });
  }

  async postComment(issueId: string, body: string, credential: PlatformCredential): Promise<string | null> {
    const token = credential.access_token;
    if (!token) return null;

    try {
      const res = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `mutation { commentCreate(input: { issueId: "${issueId}", body: ${JSON.stringify(body)} }) { success comment { id } } }`,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { data?: { commentCreate?: { comment?: { id: string } } } };
      return data.data?.commentCreate?.comment?.id ?? null;
    } catch {
      return null;
    }
  }

  async getIssue(issueId: string, credential: PlatformCredential): Promise<PlatformIssue | null> {
    const token = credential.access_token;
    if (!token) return null;

    try {
      const res = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `{ issue(id: "${issueId}") { id title description url labels { nodes { name } } assignee { name } } }`,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json() as {
        data?: {
          issue?: {
            id: string; title: string; description: string | null; url: string;
            labels?: { nodes: Array<{ name: string }> };
            assignee?: { name: string } | null;
          };
        };
      };
      const issue = data.data?.issue;
      if (!issue) return null;
      return {
        id: issue.id,
        title: issue.title,
        body: issue.description,
        url: issue.url,
        labels: issue.labels?.nodes.map((l) => l.name) ?? [],
        assignees: issue.assignee ? [issue.assignee.name] : [],
        platform: 'linear',
      };
    } catch {
      return null;
    }
  }
}

type LinearWebhookPayload = {
  type?: string;
  action?: string;
  data?: {
    title?: string;
    description?: string;
    body?: string;
    url?: string;
    assignee?: { name: string };
    issue?: { title?: string; description?: string; url?: string };
  };
};
