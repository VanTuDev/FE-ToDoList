/**
 * admin-api.ts – Client gọi các API admin.
 *
 * Token admin được lưu riêng (key: unitracker_admin_token), hoàn toàn
 * tách biệt với token user thường (unitracker_token).
 *
 * Mọi request đều gắn header: Authorization: Bearer <admin_token>
 */
import type { AppState } from "./types";
import { ApiError } from "./api";

/** URL gốc – lấy từ env giống lib/api.ts */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const ADMIN_TOKEN_KEY = "unitracker_admin_token";

// ─── Token helpers ────────────────────────────────────────────────────────────

export function getAdminToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

// ─── Base request (hỗ trợ đủ method) ────────────────────────────────────────

async function adminRequest<T>(
  path: string,
  options?: RequestInit & { method?: "GET" | "POST" | "PATCH" | "DELETE" }
): Promise<T> {
  const method = options?.method ?? "GET";
  const url = `${API_BASE}${path}`;
  const token = getAdminToken();

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, { ...options, method, headers });

    if (!res.ok) {
      let message = `API ${method} ${path}: ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message != null) {
          message = Array.isArray(body.message)
            ? body.message[0]
            : String(body.message);
        } else if (typeof body?.error === "string") {
          message = body.error;
        }
      } catch {
        const text = await res.text();
        if (text) message = `${message} – ${text.slice(0, 200)}`;
      }
      throw new ApiError(message, res.status, path);
    }

    // 204 No Content hoặc body rỗng
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }

    return (await res.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError) {
      throw new ApiError(
        `Không kết nối được server (${url}). Kiểm tra backend đã chạy chưa.`,
        0,
        path
      );
    }
    throw new ApiError(
      err instanceof Error ? err.message : "Lỗi không xác định",
      0,
      path
    );
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

/** Response khi admin đăng nhập thành công */
export type AdminAuthResponse = {
  token: string;
  userId: string;
  isAdmin: boolean;
};

/** Thông tin user trả về cho admin (không chứa passwordHash) */
export type AdminUserDto = {
  userId: string;
  phone: string;
};

// ─── Auth admin ──────────────────────────────────────────────────────────────

/**
 * Đăng nhập admin.
 *
 * POST /api/auth/login-admin
 * Body: { code, password }
 * Mặc định: code = "admin", password = "admin"
 * (override bằng ADMIN_CODE / ADMIN_PASSWORD trên BE)
 */
export function adminLogin(
  code: string,
  password: string
): Promise<AdminAuthResponse> {
  return adminRequest<AdminAuthResponse>("/api/auth/login-admin", {
    method: "POST",
    body: JSON.stringify({ code, password }),
  });
}

// ─── CRUD user ───────────────────────────────────────────────────────────────

/**
 * Lấy danh sách tất cả user.
 * GET /api/admin/users
 */
export function adminGetUsers(): Promise<AdminUserDto[]> {
  return adminRequest<AdminUserDto[]>("/api/admin/users");
}

/**
 * Lấy thông tin 1 user.
 * GET /api/admin/users/:userId
 */
export function adminGetUser(userId: string): Promise<AdminUserDto> {
  return adminRequest<AdminUserDto>(
    `/api/admin/users/${encodeURIComponent(userId)}`
  );
}

/**
 * Admin tạo user mới.
 * POST /api/admin/users
 * Body: { phone, password }
 */
export function adminCreateUser(
  phone: string,
  password: string
): Promise<AdminUserDto> {
  return adminRequest<AdminUserDto>("/api/admin/users", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

/**
 * Admin đổi mật khẩu user.
 * PATCH /api/admin/users/:userId
 * Body: { password }
 */
export function adminUpdateUserPassword(
  userId: string,
  password: string
): Promise<AdminUserDto> {
  return adminRequest<AdminUserDto>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ password }),
    }
  );
}

/**
 * Admin xóa user.
 * DELETE /api/admin/users/:userId
 */
export function adminDeleteUser(
  userId: string
): Promise<{ message: string }> {
  return adminRequest<{ message: string }>(
    `/api/admin/users/${encodeURIComponent(userId)}`,
    { method: "DELETE" }
  );
}

/**
 * Lấy toàn bộ AppState của 1 user.
 * GET /api/admin/users/:userId/state
 */
export function adminGetUserState(userId: string): Promise<AppState> {
  return adminRequest<AppState>(
    `/api/admin/users/${encodeURIComponent(userId)}/state`
  );
}
