"use client";

/**
 * /admin – Trang quản trị người dùng (CRUD).
 *
 * Không yêu cầu đăng nhập – ai cũng truy cập được.
 *
 * Chức năng:
 *  - Xem danh sách tất cả user
 *  - Tạo user mới (phone + password)
 *  - Đổi mật khẩu user
 *  - Xóa user (có confirm)
 *  - Click vào tên user → xem toàn bộ AppState (profile, tasks, subjects...)
 */

import { useCallback, useEffect, useState } from "react";
import {
  adminCreateUser,
  adminDeleteUser,
  adminGetUserState,
  adminGetUsers,
  adminUpdateUserPassword,
} from "@/lib/admin-api";
import type { AdminUserDto } from "@/lib/admin-api";
import type { AppState } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api";
import { cn } from "@/lib/utils";

// ─── Modal: Tạo user mới ─────────────────────────────────────────────────────
function CreateUserModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (user: AdminUserDto) => void;
}) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!phone.trim() || !password.trim()) {
      setError("Cần nhập đầy đủ số điện thoại và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const user = await adminCreateUser(phone.trim(), password.trim());
      onCreated(user);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tạo user thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-base font-semibold text-foreground">Tạo user mới</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="new-phone">Số điện thoại</Label>
            <Input
              id="new-phone"
              placeholder="VD: 0901234567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="new-password">Mật khẩu</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="Tối thiểu 6 ký tự"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
            />
          </div>
          {error && (
            <p className="text-sm text-destructive rounded bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Đang tạo..." : "Tạo user"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal: Đổi mật khẩu ─────────────────────────────────────────────────────
function ChangePasswordModal({
  userId,
  onClose,
  onUpdated,
}: {
  userId: string;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!password.trim()) {
      setError("Cần nhập mật khẩu mới.");
      return;
    }
    setLoading(true);
    try {
      await adminUpdateUserPassword(userId, password.trim());
      onUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Đổi mật khẩu thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg space-y-4">
        <h2 className="text-base font-semibold text-foreground">Đổi mật khẩu</h2>
        <p className="text-sm text-muted-foreground">
          User: <span className="font-medium text-foreground">{userId}</span>
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="change-password">Mật khẩu mới</Label>
            <Input
              id="change-password"
              type="password"
              placeholder="Nhập mật khẩu mới"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm text-destructive rounded bg-destructive/10 px-3 py-2">
              {error}
            </p>
          )}
          <div className="flex gap-2 pt-1">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Đang cập nhật..." : "Cập nhật"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Hủy
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Panel: Xem AppState ──────────────────────────────────────────────────────
function UserStatePanel({
  userId,
  state,
  loading,
}: {
  userId: string;
  state: AppState | null;
  loading: boolean;
}) {
  if (loading)
    return (
      <p className="text-sm text-muted-foreground">
        Đang tải dữ liệu của {userId}…
      </p>
    );
  if (!state) return null;

  const sections: { label: string; data: unknown }[] = [
    { label: "Hồ sơ", data: state.profile },
    { label: `Môn học (${state.subjects.length})`, data: state.subjects },
    { label: `Việc cần làm (${state.dailyTasks.length})`, data: state.dailyTasks },
    { label: `Lịch học (${state.studySchedules.length})`, data: state.studySchedules },
    { label: `Nhiệm vụ học (${state.studyTasks.length})`, data: state.studyTasks },
    { label: `Thời khóa biểu (${state.timetable.length})`, data: state.timetable },
  ];

  return (
    <div className="space-y-3">
      <h2 className="text-base font-semibold text-foreground">
        Dữ liệu của: <span className="text-primary">{userId}</span>
      </h2>
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <div key={s.label}>
            <p className="text-xs font-medium text-foreground mb-1">{s.label}</p>
            <pre className="rounded bg-muted p-2 text-xs overflow-auto max-h-48 text-muted-foreground">
              {JSON.stringify(s.data, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<AppState | null>(null);
  const [loadingState, setLoadingState] = useState(false);

  const [globalError, setGlobalError] = useState<string | null>(null);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [changePwUserId, setChangePwUserId] = useState<string | null>(null);

  // ─── Load danh sách user ────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    setGlobalError(null);
    try {
      const list = await adminGetUsers();
      setUsers(list);
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.message : "Không tải được danh sách user."
      );
    } finally {
      setLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ─── Click user → load AppState ────────────────────────────────────────────
  const onSelectUser = async (userId: string) => {
    // Click lại cùng user → ẩn panel
    if (selectedUserId === userId) {
      setSelectedUserId(null);
      setSelectedState(null);
      return;
    }
    setSelectedUserId(userId);
    setSelectedState(null);
    setLoadingState(true);
    setGlobalError(null);
    try {
      const state = await adminGetUserState(userId);
      setSelectedState(state);
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.message : "Không tải được dữ liệu user."
      );
    } finally {
      setLoadingState(false);
    }
  };

  // ─── Xóa user ──────────────────────────────────────────────────────────────
  const onDeleteUser = async (userId: string) => {
    if (!confirm(`Xác nhận xóa user "${userId}"? Không thể hoàn tác.`)) return;
    setGlobalError(null);
    try {
      await adminDeleteUser(userId);
      if (selectedUserId === userId) {
        setSelectedUserId(null);
        setSelectedState(null);
      }
      setUsers((prev) => prev.filter((u) => u.userId !== userId));
    } catch (err) {
      setGlobalError(
        err instanceof ApiError ? err.message : "Xóa user thất bại."
      );
    }
  };

  return (
    <div className="min-h-dvh bg-background p-4 lg:p-6 space-y-4">
      {/* Modals */}
      {showCreateModal && (
        <CreateUserModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(user) => setUsers((prev) => [...prev, user])}
        />
      )}
      {changePwUserId && (
        <ChangePasswordModal
          userId={changePwUserId}
          onClose={() => setChangePwUserId(null)}
          onUpdated={() => {}}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            Quản trị người dùng
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tổng: {loadingUsers ? "đang tải..." : `${users.length} user`}
          </p>
        </div>
        <Button size="sm" onClick={() => setShowCreateModal(true)}>
          + Tạo user mới
        </Button>
      </div>

      {/* Global error */}
      {globalError && (
        <p className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-2 text-sm text-destructive">
          {globalError}
        </p>
      )}

      {/* Layout: danh sách + panel chi tiết */}
      <div className="flex gap-4 items-start flex-col lg:flex-row">
        {/* ─── Danh sách user ─── */}
        <div className="w-full lg:w-80 shrink-0 border border-border rounded-lg bg-card overflow-hidden">
          <div className="border-b border-border px-4 py-2.5">
            <p className="text-sm font-medium text-foreground">Danh sách user</p>
          </div>

          {users.length === 0 && !loadingUsers ? (
            <p className="px-4 py-3 text-sm text-muted-foreground">
              Chưa có user nào.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {users.map((u) => (
                <li
                  key={u.userId}
                  className={cn(
                    "flex items-center justify-between gap-2 px-3 py-2.5",
                    selectedUserId === u.userId && "bg-primary/10"
                  )}
                >
                  {/* Tên user – bấm để xem dữ liệu */}
                  <button
                    type="button"
                    onClick={() => onSelectUser(u.userId)}
                    className={cn(
                      "flex-1 text-left text-sm truncate hover:text-primary transition-colors",
                      selectedUserId === u.userId
                        ? "text-primary font-medium"
                        : "text-foreground"
                    )}
                    title={u.phone}
                  >
                    {u.phone}
                  </button>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setChangePwUserId(u.userId)}
                      className="text-xs px-2 py-1 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                      title="Đổi mật khẩu"
                    >
                      🔑 Đổi mk
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteUser(u.userId)}
                      className="text-xs px-2 py-1 rounded border border-destructive/40 text-destructive hover:bg-destructive/10 transition-colors"
                      title="Xóa user"
                    >
                      🗑 Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ─── Panel AppState ─── */}
        <div className="flex-1 min-w-0 border border-border rounded-lg bg-card p-4 overflow-auto">
          {!selectedUserId ? (
            <p className="text-sm text-muted-foreground">
              Nhấn vào tên user ở danh sách bên trái để xem toàn bộ dữ liệu.
            </p>
          ) : (
            <UserStatePanel
              userId={selectedUserId}
              state={selectedState}
              loading={loadingState}
            />
          )}
        </div>
      </div>
    </div>
  );
}
