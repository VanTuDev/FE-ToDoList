"use client";

/**
 * /loginAdmin – Trang đăng nhập dành riêng cho admin.
 *
 * - Mã admin mặc định: "admin", mật khẩu: "admin"
 *   (thay bằng ADMIN_CODE / ADMIN_PASSWORD trong .env của BE)
 * - Sau khi đăng nhập, token admin được lưu riêng vào localStorage
 *   (key: unitracker_admin_token), tách biệt hoàn toàn với token user thường.
 * - Chuyển sang /admin sau khi đăng nhập thành công.
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminLogin, setAdminToken } from "@/lib/admin-api";
import { ApiError } from "@/lib/api";

export default function LoginAdminPage() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim() || !password.trim()) {
      setError("Vui lòng nhập đầy đủ mã admin và mật khẩu.");
      return;
    }
    setLoading(true);
    try {
      const res = await adminLogin(code.trim(), password.trim());
      setAdminToken(res.token);
      router.replace("/admin");
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else if (err instanceof Error) setError(err.message);
      else setError("Đăng nhập admin thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Đăng nhập Admin
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Trang quản trị – chỉ dành cho quản trị viên.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="admin-code">Mã admin</Label>
            <Input
              id="admin-code"
              placeholder="admin"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="bg-secondary border-border"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="admin-password">Mật khẩu</Label>
            <Input
              id="admin-password"
              type="password"
              placeholder="••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-secondary border-border"
              autoComplete="current-password"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="rounded-md bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>

        {/* Hint */}
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          Mặc định: mã <code className="bg-muted px-1 rounded">admin</code>,
          mật khẩu <code className="bg-muted px-1 rounded">admin</code>
          <br />
          Thay bằng biến môi trường{" "}
          <code className="bg-muted px-1 rounded">ADMIN_CODE</code> /{" "}
          <code className="bg-muted px-1 rounded">ADMIN_PASSWORD</code> trong{" "}
          <code className="bg-muted px-1 rounded">BE/.env</code>.
        </p>
      </div>
    </div>
  );
}
