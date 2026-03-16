/**
 * Client gọi API backend – dùng fetch, bắt lỗi rõ ràng để dễ debug.
 */
import type {
  AppState,
  UserProfile,
  Subject,
  TimetableSlot,
  DailyTask,
  StudySchedule,
  StudyTask,
} from "./types";

/**
 * URL backend:
 * - Dev: NEXT_PUBLIC_API_URL=http://localhost:4000
 * - Vercel (dùng proxy): để trống "" → FE gọi /api/... (cùng domain), Next.js proxy (app/api/[...path]) chuyển tiếp tới BACKEND_URL
 * - Vercel (gọi thẳng): NEXT_PUBLIC_API_URL=https://your-backend.railway.app
 * - Docker + Nginx: ""
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

const AUTH_TOKEN_KEY = "unitracker_token";
const AUTH_USER_ID_KEY = "unitracker_userId";

/** Lấy token đã lưu (client-only) */
export function getStoredToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/** Lưu token sau đăng nhập/đăng ký */
export function setAuthStorage(token: string, userId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(AUTH_USER_ID_KEY, userId);
}

/** Xóa toàn bộ trạng thái đăng nhập: localStorage, sessionStorage, cookie (đăng xuất) */
export function clearAuthStorage(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_ID_KEY);
  sessionStorage.clear();
  // Xóa toàn bộ cookie (phạm vi path hiện tại)
  const cookies = document.cookie.split(";");
  for (const c of cookies) {
    const eq = c.indexOf("=");
    const name = eq > -1 ? c.slice(0, eq).trim() : c.trim();
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
  }
}

/** Lỗi API – giữ message và status để debug */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public path: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/**
 * Gọi GET/POST/PATCH/DELETE – trả về JSON hoặc ném ApiError khi lỗi.
 * Tự gắn Authorization: Bearer <token> nếu có token.
 */
async function request<T>(
  path: string,
  options?: RequestInit & { method?: "GET" | "POST" | "PATCH" | "DELETE" }
): Promise<T> {
  const method = options?.method ?? "GET";
  const url = `${API_BASE}${path}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(url, {
      ...options,
      method,
      headers,
    });

    if (!res.ok) {
      let message = `API ${method} ${path}: ${res.status}`;
      try {
        const body = await res.json();
        if (body?.message != null) {
          message = Array.isArray(body.message) ? body.message[0] : String(body.message);
        } else if (typeof body?.error === "string") {
          message = body.error;
        }
      } catch {
        const text = await res.text();
        if (text) message = `${message} – ${text.slice(0, 200)}`;
      }
      const err = new ApiError(message, res.status, path);
      throw err;
    }

    // DELETE có thể không có body
    if (res.status === 204 || res.headers.get("content-length") === "0") {
      return undefined as T;
    }

    const data = await res.json();
    return data as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof TypeError && err.message.includes("fetch")) {
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

// ========== Data (full state) ==========

/** GET toàn bộ state – dùng khi load app hoặc refresh */
export function getState(): Promise<AppState> {
  return request<AppState>("/api/data/state");
}

// ========== Auth – đăng ký / đăng nhập ==========

export type AuthResponse = { token: string; userId: string };

/** POST đăng ký: SĐT + mật khẩu. Trả về token + userId. */
export function register(phone: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

/** POST đăng nhập: SĐT + mật khẩu. Trả về token + userId. */
export function login(phone: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ phone, password }),
  });
}

// ========== Profile – CRUD ==========

export function getProfile(): Promise<UserProfile> {
  return request<UserProfile>("/api/profile");
}

/** PATCH cập nhật profile (một phần) */
export function updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
  return request<UserProfile>("/api/profile", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// ========== Môn học – CRUD ==========

export function getSubjects(): Promise<Subject[]> {
  return request<Subject[]>("/api/subjects");
}

/** POST thêm môn học */
export function createSubject(data: Omit<Subject, "id">): Promise<Subject> {
  return request<Subject>("/api/subjects", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH sửa môn học */
export function updateSubject(id: string, data: Partial<Subject>): Promise<Subject> {
  return request<Subject>(`/api/subjects/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE xóa môn học */
export function deleteSubject(id: string): Promise<void> {
  return request<void>(`/api/subjects/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ========== Thời khóa biểu – CRUD ==========

export function getTimetable(): Promise<TimetableSlot[]> {
  return request<TimetableSlot[]>("/api/timetable");
}

/** POST thêm tiết TKB */
export function createTimetableSlot(data: Omit<TimetableSlot, "id">): Promise<TimetableSlot> {
  return request<TimetableSlot>("/api/timetable", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** DELETE xóa tiết TKB */
export function deleteTimetableSlot(id: string): Promise<void> {
  return request<void>(`/api/timetable/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ========== Việc cần làm – CRUD ==========

export function getDailyTasks(): Promise<DailyTask[]> {
  return request<DailyTask[]>("/api/daily-tasks");
}

/** POST thêm việc cần làm */
export function createDailyTask(data: Omit<DailyTask, "id">): Promise<DailyTask> {
  return request<DailyTask>("/api/daily-tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH đánh dấu hoàn thành / chưa hoàn thành */
export function toggleDailyTask(id: string): Promise<DailyTask | null> {
  return request<DailyTask>(`/api/daily-tasks/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
  });
}

/** DELETE xóa việc cần làm */
export function deleteDailyTask(id: string): Promise<void> {
  return request<void>(`/api/daily-tasks/${encodeURIComponent(id)}`, { method: "DELETE" });
}

/** POST thêm nhiều việc một lúc (bulk) */
export function createDailyTasksBulk(
  tasks: Array<{ title: string; priority?: "high" | "medium" | "low" }>
): Promise<DailyTask[]> {
  return request<DailyTask[]>("/api/daily-tasks/bulk", {
    method: "POST",
    body: JSON.stringify({ tasks }),
  });
}

// ========== Lịch học tự đặt – CRUD ==========

export function getStudySchedules(): Promise<StudySchedule[]> {
  return request<StudySchedule[]>("/api/study-schedules");
}

/** POST thêm lịch học tự đặt */
export function createStudySchedule(data: Omit<StudySchedule, "id">): Promise<StudySchedule> {
  return request<StudySchedule>("/api/study-schedules", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** PATCH đánh dấu hoàn thành / chưa */
export function toggleStudySchedule(id: string): Promise<StudySchedule | null> {
  return request<StudySchedule>(`/api/study-schedules/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
  });
}

/** DELETE xóa lịch học tự đặt */
export function deleteStudySchedule(id: string): Promise<void> {
  return request<void>(`/api/study-schedules/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ========== Nhiệm vụ học tập (chỉ đọc + toggle) ==========

export function getStudyTasks(): Promise<StudyTask[]> {
  return request<StudyTask[]>("/api/study-tasks");
}

/** PATCH đánh dấu hoàn thành / chưa */
export function toggleStudyTask(id: string): Promise<StudyTask | null> {
  return request<StudyTask>(`/api/study-tasks/${encodeURIComponent(id)}/toggle`, {
    method: "PATCH",
  });
}
