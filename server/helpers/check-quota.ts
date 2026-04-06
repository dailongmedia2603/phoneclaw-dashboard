/**
 * Package quota enforcement helpers.
 * 100% server-side — frontend chỉ hiển thị, không validate.
 *
 * Rules:
 * - Admin luôn bypass (isAdmin → allowed: true)
 * - User chưa gán gói → không giới hạn
 * - Package not found → không giới hạn
 * - -1 = không giới hạn
 */

import type { Request } from 'express';
import { getAuthUserId, isAdmin } from './get-user';
import { readCollection, readUserCollection } from '../store';
import { getDevicesForTenant } from '../services/device-manager';
import { getScriptsForTenant } from '../services/script-engine';
import { getSchedulesForTenant } from '../services/scheduler';

interface QuotaResult {
  allowed: boolean;
  error?: string;
  limit?: number;
  current?: number;
}

interface PackageFull {
  id: string;
  name: string;
  maxDevices: number;
  maxScripts?: number;
  maxSchedules?: number;
  proxyEnabled?: boolean;
  gpsSpoofEnabled?: boolean;
  apiTokensEnabled?: boolean;
  maxVideoStorageMB?: number;
}

interface UserWithPkg {
  id: string;
  packageId?: string;
}

async function getUserPackage(req: Request): Promise<{ pkg: PackageFull | null; userId: string | null }> {
  const userId = getAuthUserId(req);
  if (!userId) return { pkg: null, userId: null };

  const users = await readCollection<UserWithPkg>('users');
  const user = users.find(u => u.id === userId);
  if (!user?.packageId) return { pkg: null, userId };

  const packages = await readCollection<PackageFull>('packages');
  const pkg = packages.find(p => p.id === user.packageId) || null;
  return { pkg, userId };
}

/**
 * Check quota cho resource có số lượng giới hạn (devices, scripts, schedules).
 */
export async function checkQuota(
  req: Request,
  resource: 'devices' | 'scripts' | 'schedules',
): Promise<QuotaResult> {
  if (isAdmin(req)) return { allowed: true };

  const { pkg, userId } = await getUserPackage(req);
  if (!userId) return { allowed: false, error: 'Unauthorized' };
  if (!pkg) return { allowed: true }; // no package = no limit

  const limitMap: Record<string, number> = {
    devices: pkg.maxDevices ?? -1,
    scripts: pkg.maxScripts ?? -1,
    schedules: pkg.maxSchedules ?? -1,
  };

  const limit = limitMap[resource];
  if (limit === -1) return { allowed: true }; // unlimited

  let count = 0;
  if (resource === 'devices') {
    const items = await getDevicesForTenant(userId);
    count = items.length;
  } else if (resource === 'scripts') {
    const items = await getScriptsForTenant(userId);
    count = items.length;
  } else if (resource === 'schedules') {
    const items = await getSchedulesForTenant(userId);
    count = items.length;
  }

  if (count >= limit) {
    const nameMap: Record<string, string> = {
      devices: 'thiết bị',
      scripts: 'kịch bản',
      schedules: 'lịch trình',
    };
    return {
      allowed: false,
      error: `Đã đạt giới hạn ${limit} ${nameMap[resource]} (gói ${pkg.name}). Nâng cấp gói để mở rộng.`,
      limit,
      current: count,
    };
  }

  return { allowed: true, limit, current: count };
}

/**
 * Check feature toggle (proxy, gpsSpoof, apiTokens).
 */
export async function checkFeature(
  req: Request,
  feature: 'proxy' | 'gpsSpoof' | 'apiTokens',
): Promise<QuotaResult> {
  if (isAdmin(req)) return { allowed: true };

  const { pkg } = await getUserPackage(req);
  if (!pkg) return { allowed: true }; // no package = no limit

  const featureMap: Record<string, boolean> = {
    proxy: pkg.proxyEnabled ?? true,
    gpsSpoof: pkg.gpsSpoofEnabled ?? true,
    apiTokens: pkg.apiTokensEnabled ?? true,
  };

  if (!featureMap[feature]) {
    const nameMap: Record<string, string> = {
      proxy: 'Đổi IP (Proxy)',
      gpsSpoof: 'Giả lập vị trí (GPS Spoof)',
      apiTokens: 'API Tokens',
    };
    return {
      allowed: false,
      error: `${nameMap[feature]} không khả dụng trong gói ${pkg.name}. Nâng cấp gói để sử dụng.`,
    };
  }

  return { allowed: true };
}

/**
 * Check video storage quota (bytes).
 */
export async function checkVideoStorage(
  req: Request,
  newFileSizeBytes: number,
): Promise<QuotaResult> {
  if (isAdmin(req)) return { allowed: true };

  const { pkg, userId } = await getUserPackage(req);
  if (!userId) return { allowed: false, error: 'Unauthorized' };
  if (!pkg) return { allowed: true };

  const maxMB = pkg.maxVideoStorageMB ?? -1;
  if (maxMB === -1) return { allowed: true };

  interface VideoItem { size: number }
  const videos = await readUserCollection<VideoItem>(userId, 'videos');
  const usedBytes = videos.reduce((sum, v) => sum + (v.size || 0), 0);
  const totalAfter = usedBytes + newFileSizeBytes;
  const maxBytes = maxMB * 1024 * 1024;

  if (totalAfter > maxBytes) {
    const usedMB = Math.round(usedBytes / (1024 * 1024));
    return {
      allowed: false,
      error: `Dung lượng video đã đạt giới hạn ${maxMB}MB (đang dùng ${usedMB}MB, gói ${pkg.name}). Xoá video cũ hoặc nâng cấp gói.`,
      limit: maxMB,
      current: usedMB,
    };
  }

  return { allowed: true };
}
