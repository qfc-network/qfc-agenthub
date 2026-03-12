import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3100),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? '',
  githubToken: process.env.GITHUB_TOKEN ?? '',
  // QFC on-chain identity (Phase 4)
  agentRegistryContract: process.env.AGENT_REGISTRY_CONTRACT ?? '0x7791dfa4d489f3d524708cbc0caa8689b76322b3',
  chainId: Number(process.env.CHAIN_ID ?? 9000),
  rpcUrl: process.env.RPC_URL ?? 'https://rpc.testnet.qfc.network',
} as const;

export function validateConfig(): void {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
}
