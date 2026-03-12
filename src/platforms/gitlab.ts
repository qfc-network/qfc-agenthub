import type { PlatformBridge, PlatformCredential, PlatformIssue } from '../domain/platform.js';
import { getActorByHandle } from '../domain/actor.js';
import { createAssignment } from '../domain/assignment.js';

export class GitLabBridge implements PlatformBridge {
  platform = 'gitlab' as const;

  async handleWebhook(_headers: Record<string, string>, body: unknown): Promise<void> {
    const payload = body as GitLabWebhookPayload;

    // Handle issue events
    if (payload.object_kind === 'issue') {
      await this.handleIssueEvent(payload);
    }

    // Handle note (comment) events
    if (payload.object_kind === 'note' && payload.issue) {
      await this.handleNoteEvent(payload);
    }
  }

  private async handleIssueEvent(payload: GitLabWebhookPayload): Promise<void> {
    if (!payload.object_attributes) return;
    const attrs = payload.object_attributes;

    // On assignment
    if (attrs.action === 'update' && payload.assignees && payload.assignees.length > 0) {
      for (const assignee of payload.assignees) {
        const agent = await getActorByHandle(assignee.username);
        if (!agent || agent.type !== 'agent') continue;

        await createAssignment({
          actor_id: agent.id,
          title: attrs.title ?? 'GitLab Issue',
          description: attrs.description ?? undefined,
          github_repo: payload.project?.path_with_namespace,
          github_issue_number: attrs.iid,
          github_issue_url: attrs.url,
        });
      }
    }
  }

  private async handleNoteEvent(payload: GitLabWebhookPayload): Promise<void> {
    const note = payload.object_attributes;
    if (!note?.note) return;

    // Parse commands (same format as GitHub: /assign-agent, etc.)
    const match = note.note.match(/^\/assign-agent\s+(\S+)/m);
    if (match) {
      const handle = match[1];
      const agent = await getActorByHandle(handle);
      if (!agent || agent.type !== 'agent') return;

      const issue = payload.issue;
      if (!issue) return;

      await createAssignment({
        actor_id: agent.id,
        title: issue.title ?? 'GitLab Issue',
        description: issue.description ?? undefined,
        github_repo: payload.project?.path_with_namespace,
        github_issue_number: issue.iid,
        github_issue_url: issue.url,
      });
    }
  }

  async postComment(issueId: string, body: string, credential: PlatformCredential): Promise<string | null> {
    const [projectPath, issueIid] = issueId.split('#');
    const token = credential.access_token;
    const baseUrl = credential.base_url ?? 'https://gitlab.com';
    if (!token) return null;

    const encodedProject = encodeURIComponent(projectPath);
    const url = `${baseUrl}/api/v4/projects/${encodedProject}/issues/${issueIid}/notes`;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'PRIVATE-TOKEN': token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ body }),
      });
      if (!res.ok) return null;
      const data = await res.json() as { id: number };
      return String(data.id);
    } catch {
      return null;
    }
  }

  async getIssue(issueId: string, credential: PlatformCredential): Promise<PlatformIssue | null> {
    const [projectPath, issueIid] = issueId.split('#');
    const token = credential.access_token;
    const baseUrl = credential.base_url ?? 'https://gitlab.com';
    if (!token) return null;

    const encodedProject = encodeURIComponent(projectPath);
    const url = `${baseUrl}/api/v4/projects/${encodedProject}/issues/${issueIid}`;

    try {
      const res = await fetch(url, {
        headers: { 'PRIVATE-TOKEN': token },
      });
      if (!res.ok) return null;
      const data = await res.json() as {
        iid: number; title: string; description: string | null; web_url: string;
        labels: string[]; assignees: Array<{ username: string }>;
      };
      return {
        id: `${projectPath}#${data.iid}`,
        title: data.title,
        body: data.description,
        url: data.web_url,
        labels: data.labels,
        assignees: data.assignees.map((a) => a.username),
        platform: 'gitlab',
      };
    } catch {
      return null;
    }
  }
}

type GitLabWebhookPayload = {
  object_kind?: string;
  object_attributes?: {
    action?: string;
    title?: string;
    description?: string;
    note?: string;
    iid?: number;
    url?: string;
  };
  project?: { path_with_namespace?: string };
  assignees?: Array<{ username: string }>;
  issue?: {
    title?: string;
    description?: string;
    iid?: number;
    url?: string;
  };
};
