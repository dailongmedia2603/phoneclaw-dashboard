/**
 * Helper functions để lấy thông tin user từ request.
 * Dùng xuyên suốt routes để enforce data isolation.
 *
 * Quy ước:
 * - getTenantId(req) → luôn trả về userId (kể cả admin) — mỗi user chỉ thấy data của mình
 * - getAuthUserId(req) → luôn trả về userId (kể cả admin) — dùng khi ghi data
 * - isAdmin(req) → boolean check role
 */

import type { Request } from 'express';

interface AuthPayload {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

/**
 * Lấy tenant ID để filter data.
 *
 * Mỗi user (kể cả admin) chỉ thấy data của chính mình.
 * Dùng cho GET endpoints — quyết định user thấy data gì.
 */
export function getTenantId(req: Request): string | undefined {
  const user = (req as any).user as AuthPayload | undefined;
  if (!user) return undefined;
  return user.id;
}

/**
 * Luôn trả về userId của người đang thao tác.
 * Dùng khi CẦN biết ai đang tạo/sửa/xoá resource (kể cả admin).
 */
export function getAuthUserId(req: Request): string | undefined {
  return ((req as any).user as AuthPayload | undefined)?.id;
}

/**
 * Kiểm tra user hiện tại có phải admin không.
 */
export function isAdmin(req: Request): boolean {
  return ((req as any).user as AuthPayload | undefined)?.role === 'admin';
}
