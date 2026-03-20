/**
 * Community API – bài viết, bạn bè, tin nhắn.
 * Dùng cùng token JWT lưu trong localStorage như api.ts.
 */
import { getStoredToken } from "./api";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

// ─── Types ───────────────────────────────────────────────────────────────────

export type CommentItem = {
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
};

export type CommunityPost = {
  _id: string;
  userId: string;
  displayName: string;
  content: string;
  likes: string[];
  comments: CommentItem[];
  createdAt: string;
};

export type CommunityUser = {
  userId: string;
  displayName: string;
  class: string;
  major: string;
  studentId: string;
  avatar: string;
};

export type FriendRequest = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  status: "pending" | "accepted" | "rejected";
};

export type FriendUser = {
  userId: string;
  displayName: string;
  avatar: string;
};

export type ChatMessage = {
  _id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  createdAt: string;
};

// ─── Helper ──────────────────────────────────────────────────────────────────

async function req<T>(
  path: string,
  options?: RequestInit & { method?: string }
): Promise<T> {
  const token = getStoredToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    method: options?.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    let msg = `${res.status}`;
    try {
      const body = await res.json();
      msg = body?.message ?? body?.error ?? msg;
    } catch {
      /* ignore */
    }
    throw new Error(Array.isArray(msg) ? msg[0] : String(msg));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ─── Posts ───────────────────────────────────────────────────────────────────

export function getPosts(page = 1, limit = 20) {
  return req<CommunityPost[]>(
    `/api/community/posts?page=${page}&limit=${limit}`
  );
}

export function createPost(content: string, displayName: string) {
  return req<CommunityPost>("/api/community/posts", {
    method: "POST",
    body: JSON.stringify({ content, displayName }),
  });
}

export function toggleLike(postId: string) {
  return req<{ likes: number; liked: boolean }>(
    `/api/community/posts/${postId}/like`,
    { method: "POST" }
  );
}

export function addComment(postId: string, content: string, displayName: string) {
  return req<CommentItem>(`/api/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content, displayName }),
  });
}

export function deletePost(postId: string) {
  return req<{ success: boolean }>(`/api/community/posts/${postId}`, {
    method: "DELETE",
  });
}

// ─── Users ───────────────────────────────────────────────────────────────────

export function getCommunityUsers() {
  return req<CommunityUser[]>("/api/community/users");
}

// ─── Friends ─────────────────────────────────────────────────────────────────

export function sendFriendRequest(toUserId: string) {
  return req<FriendRequest>("/api/community/friends/request", {
    method: "POST",
    body: JSON.stringify({ toUserId }),
  });
}

export function getFriendRequests() {
  return req<{ received: FriendRequest[]; sent: FriendRequest[] }>(
    "/api/community/friends/requests"
  );
}

export function respondFriendRequest(requestId: string, action: "accept" | "reject") {
  return req<{ status: string }>(
    `/api/community/friends/requests/${requestId}`,
    {
      method: "PATCH",
      body: JSON.stringify({ action }),
    }
  );
}

export function getFriends() {
  return req<FriendUser[]>("/api/community/friends");
}

// ─── Messages ────────────────────────────────────────────────────────────────

/** Lấy toàn bộ tin nhắn với bạn */
export function getMessages(friendId: string) {
  return req<ChatMessage[]>(`/api/community/messages/${friendId}`);
}

/** Long-poll: chỉ lấy tin nhắn mới hơn `after` (ISO string).
 *  FE gọi mỗi 30s khi đang mở cửa sổ chat. */
export function pollNewMessages(friendId: string, after: string) {
  return req<ChatMessage[]>(
    `/api/community/messages/${friendId}?after=${encodeURIComponent(after)}`
  );
}

export function sendChatMessage(friendId: string, content: string) {
  return req<ChatMessage>(`/api/community/messages/${friendId}`, {
    method: "POST",
    body: JSON.stringify({ content }),
  });
}
