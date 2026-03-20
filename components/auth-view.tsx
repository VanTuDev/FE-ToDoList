"use client";

/**
 * AuthView – Màn hình đăng nhập / đăng ký.
 *
 * Cơ chế định danh người dùng:
 *  - Mỗi SĐT = 1 tài khoản duy nhất (unique index trong MongoDB).
 *  - Sau khi đăng ký / đăng nhập thành công, BE trả về:
 *      { token: JWT, userId: <phone đã chuẩn hóa> }
 *  - Token JWT được ký với sub = userId (phone).
 *  - Tất cả dữ liệu (TKB, tasks, môn học...) đều lưu kèm userId này,
 *    đảm bảo hoàn toàn tách biệt giữa các tài khoản.
 *
 * Xử lý lỗi:
 *  - 409 Conflict (register): SĐT đã tồn tại → tự chuyển sang tab Đăng nhập.
 *  - 401 Unauthorized (login): sai mật khẩu.
 *  - Validate client-side trước khi gửi request.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { login, register, setAuthStorage, getUserInfo, setSessionUserDisplay, ApiError } from "@/lib/api";

type Tab = "login" | "register";

type Props = {
  onSuccess: () => void;
};

export function AuthView({ onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("login");

  // State riêng cho từng form để không bị lẫn dữ liệu
  const [loginPhone, setLoginPhone] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordConfirm, setRegPasswordConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // ─── Validate phone ────────────────────────────────────────────────────────
  function validatePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, "");
    if (!digits) return "Vui lòng nhập số điện thoại.";
    if (digits.length < 9 || digits.length > 11)
      return "Số điện thoại không hợp lệ (9–11 chữ số).";
    return null;
  }

  // ─── Đăng nhập ────────────────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const phoneErr = validatePhone(loginPhone);
    if (phoneErr) { setError(phoneErr); return; }
    if (!loginPassword.trim()) { setError("Vui lòng nhập mật khẩu."); return; }

    setLoading(true);
    try {
      const res = await login(loginPhone.trim(), loginPassword.trim());
      setAuthStorage(res.token, res.userId);
      try {
        const info = await getUserInfo();
        if (info.name?.trim() || info.avatar?.trim()) {
          setSessionUserDisplay(info.name ?? "", info.avatar ?? "");
        }
      } catch { /* ignore */ }
      setSuccessMsg("Đăng nhập thành công!");
      setTimeout(() => onSuccess(), 300);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) {
          setError("Số điện thoại hoặc mật khẩu không đúng.");
        } else {
          setError(err.message);
        }
      } else {
        setError("Không kết nối được server. Kiểm tra backend đã chạy chưa.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ─── Đăng ký ──────────────────────────────────────────────────────────────
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    // Validate
    const phoneErr = validatePhone(regPhone);
    if (phoneErr) { setError(phoneErr); return; }
    if (regPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }
    if (regPassword !== regPasswordConfirm) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      const res = await register(regPhone.trim(), regPassword);
      setAuthStorage(res.token, res.userId);
      try {
        const info = await getUserInfo();
        if (info.name?.trim() || info.avatar?.trim()) {
          setSessionUserDisplay(info.name ?? "", info.avatar ?? "");
        }
      } catch { /* ignore */ }
      setSuccessMsg("Đăng ký thành công! Chào mừng bạn.");
      setTimeout(() => onSuccess(), 300);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 409) {
          // SĐT đã tồn tại → chuyển sang tab đăng nhập với SĐT đó
          setLoginPhone(regPhone);
          setActiveTab("login");
          setError(
            `Số điện thoại ${regPhone.trim()} đã được đăng ký. Vui lòng đăng nhập.`
          );
        } else {
          setError(err.message);
        }
      } else {
        setError("Không kết nối được server. Kiểm tra backend đã chạy chưa.");
      }
    } finally {
      setLoading(false);
    }
  };

  const onTabChange = (v: string) => {
    setActiveTab(v as Tab);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Logo */}
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">
            FPT UniTracker
          </span>
        </div>

        {/* Error / Success banner */}
        {error && (
          <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-600">
            {successMsg}
          </div>
        )}

        {/* ─── Google OAuth ─────────────────────────────────────────────── */}
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"}/api/auth/google`}
          className="mb-4 flex w-full items-center justify-center gap-3 rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary/70 hover:border-primary/50"
        >
          {/* Google G logo (SVG inline để không phụ thuộc package) */}
          <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Tiếp tục với Google
        </a>

        {/* Divider */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex-1 border-t border-border" />
          <span className="text-xs text-muted-foreground">hoặc</span>
          <div className="flex-1 border-t border-border" />
        </div>

        <Tabs value={activeTab} onValueChange={onTabChange}>
          <TabsList className="mb-4 grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          {/* ─── Tab Đăng nhập ─── */}
          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone">Số điện thoại</Label>
                <Input
                  id="login-phone"
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="tel"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Mật khẩu</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Chưa có tài khoản?{" "}
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => onTabChange("register")}
                >
                  Đăng ký ngay
                </button>
              </p>
            </form>
          </TabsContent>

          {/* ─── Tab Đăng ký ─── */}
          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Số điện thoại</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Số điện thoại là ID duy nhất của bạn trong hệ thống.
                  Mỗi số chỉ đăng ký được 1 lần.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mật khẩu</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password-confirm">Xác nhận mật khẩu</Label>
                <Input
                  id="reg-password-confirm"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={regPasswordConfirm}
                  onChange={(e) => setRegPasswordConfirm(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang xử lý..." : "Tạo tài khoản"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="text-primary underline-offset-2 hover:underline"
                  onClick={() => onTabChange("login")}
                >
                  Đăng nhập
                </button>
              </p>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
