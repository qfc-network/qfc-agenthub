/**
 * Parse agent commands from GitHub issue/PR comments.
 *
 * Supported commands:
 *   /assign-agent <handle>   — assign issue to an agent
 *   /agent-status            — request status of current assignment
 *   /cancel-agent            — cancel current agent assignment
 */

export type AgentCommand =
  | { type: 'assign-agent'; handle: string }
  | { type: 'agent-status' }
  | { type: 'cancel-agent' };

export function parseCommand(commentBody: string): AgentCommand | null {
  const lines = commentBody.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    const assignMatch = trimmed.match(/^\/assign-agent\s+(\S+)/);
    if (assignMatch) {
      return { type: 'assign-agent', handle: assignMatch[1] };
    }

    if (trimmed === '/agent-status') {
      return { type: 'agent-status' };
    }

    if (trimmed === '/cancel-agent') {
      return { type: 'cancel-agent' };
    }
  }

  return null;
}
