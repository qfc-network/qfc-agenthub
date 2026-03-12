import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 3100),
  host: process.env.HOST ?? '0.0.0.0',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: process.env.DATABASE_URL ?? '',
  githubWebhookSecret: process.env.GITHUB_WEBHOOK_SECRET ?? '',
  githubToken: process.env.GITHUB_TOKEN ?? '',
} as const;

export function validateConfig(): void {
  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }
}
