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
import { login, register, setAuthStorage, ApiError } from "@/lib/api";

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
      setSuccessMsg("Đăng nhập thành công!");
      // Delay nhỏ để user thấy toast success
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
