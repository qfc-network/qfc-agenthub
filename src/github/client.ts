import { config } from '../config.js';
import type { Receipt } from '../domain/receipt.js';

/**
 * Post a receipt summary as a comment on a GitHub issue.
 * Returns the comment ID or null if posting failed.
 */
export async function postReceiptComment(
  repo: string,
  issueNumber: number,
  receipt: Receipt
): Promise<number | null> {
  if (!config.githubToken) {
    console.warn('[GitHub] No GITHUB_TOKEN set — skipping comment');
    return null;
  }

  const statusEmoji = receipt.status === 'success' ? '\u2705'
    : receipt.status === 'failure' ? '\u274C'
      : '\u26A0\uFE0F';

  const lines = [
    `## ${statusEmoji} Agent Execution Receipt`,
    '',
    `**Status**: ${receipt.status}`,
    `**Run ID**: \`${receipt.run_id}\``,
    `**Receipt ID**: \`${receipt.id}\``,
  ];

  if (receipt.summary) {
    lines.push('', `### Summary`, '', receipt.summary);
  }

  if (receipt.actions.length > 0) {
    lines.push('', '### Actions', '');
    for (const action of receipt.actions) {
      lines.push(`- **${action.type}**: ${action.description}`);
    }
  }

  if (receipt.outputs.length > 0) {
    lines.push('', '### Outputs', '');
    for (const output of receipt.outputs) {
      if (output.url) {
        lines.push(`- [${output.type}](${output.url})`);
      } else if (output.content) {
        lines.push(`- **${output.type}**: ${output.content.slice(0, 200)}`);
      }
    }
  }

  if (receipt.artifacts.length > 0) {
    lines.push('', '### Artifacts', '');
    for (const artifact of receipt.artifacts) {
      lines.push(`- [${artifact.name}](${artifact.url})`);
    }
  }

  lines.push('', '---', '*Posted by qfc-agenthub*');

  const body = lines.join('\n');
  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`;

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });

    if (!res.ok) {
      console.warn(`[GitHub] Failed to post comment: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json() as { id: number };
    return data.id;
  } catch (err) {
    console.warn('[GitHub] Error posting comment:', err);
    return null;
  }
}

/**
 * Post a simple comment on a GitHub issue.
 */
export async function postComment(repo: string, issueNumber: number, body: string): Promise<number | null> {
  if (!config.githubToken) return null;

  const url = `https://api.github.com/repos/${repo}/issues/${issueNumber}/comments`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.githubToken}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    });
    if (!res.ok) return null;
    const data = await res.json() as { id: number };
    return data.id;
  } catch {
    return null;
  }
}
