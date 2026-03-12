import type { PlatformBridge, PlatformCredential, PlatformIssue } from '../domain/platform.js';
import { config } from '../config.js';
import { handleGithubEvent } from '../github/events.js';

export class GitHubBridge implements PlatformBridge {
  platform = 'github' as const;

  async handleWebhook(headers: Record<string, string>, body: unknown): Promise<void> {
    const event = headers['x-github-event'] ?? '';
    await handleGithubEvent(event, body as Parameters<typeof handleGithubEvent>[1]);
  }

  async postComment(issueId: string, body: string, credential: PlatformCredential): Promise<string | null> {
    const [repo, issueNumber] = issueId.split('#');
    const token = credential.access_token ?? config.githubToken;
    if (!token) return null;

    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`;
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
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
    const [repo, issueNumber] = issueId.split('#');
    const token = credential.access_token ?? config.githubToken;
    if (!token) return null;

    const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}`;
    try {
      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.github+json',
        },
      });
      if (!res.ok) return null;
      const data = await res.json() as {
        number: number; title: string; body: string | null; html_url: string;
        labels: Array<{ name: string }>; assignees: Array<{ login: string }>;
      };
      return {
        id: `${repo}#${data.number}`,
        title: data.title,
        body: data.body,
        url: data.html_url,
        labels: data.labels.map((l) => l.name),
        assignees: data.assignees.map((a) => a.login),
        platform: 'github',
      };
    } catch {
      return null;
    }
  }
}
