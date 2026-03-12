import type { PlatformBridge, PlatformType } from '../domain/platform.js';
import { GitHubBridge } from './github.js';
import { GitLabBridge } from './gitlab.js';
import { LinearBridge } from './linear.js';

const bridges = new Map<PlatformType, PlatformBridge>();

export function registerBridge(bridge: PlatformBridge): void {
  bridges.set(bridge.platform, bridge);
}

export function getBridge(platform: PlatformType): PlatformBridge | undefined {
  return bridges.get(platform);
}

export function getAllBridges(): PlatformBridge[] {
  return Array.from(bridges.values());
}

// Register all built-in bridges
registerBridge(new GitHubBridge());
registerBridge(new GitLabBridge());
registerBridge(new LinearBridge());
