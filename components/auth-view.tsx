"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap } from "lucide-react";
import { login, register, setAuthStorage, ApiError } from "@/lib/api";
import { toast } from "sonner";

type Props = {
  onSuccess: () => void;
};

export function AuthView({ onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedPhone = phone.trim();
    const trimmedPassword = password.trim();
    if (!trimmedPhone || !trimmedPassword) {
      toast.error("Vui lòng nhập số điện thoại và mật khẩu");
      return;
    }
    setLoading(true);
    try {
      const res =
        activeTab === "register"
          ? await register(trimmedPhone, trimmedPassword)
          : await login(trimmedPhone, trimmedPassword);
      setAuthStorage(res.token, res.userId);
      toast.success(activeTab === "register" ? "Đăng ký thành công!" : "Đăng nhập thành công!");
      onSuccess();
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Số điện thoại hoặc mật khẩu không đúng";
      toast.error(msg);
      if (err instanceof ApiError && err.status === 401 && activeTab === "login") {
        toast.info("Chưa có tài khoản? Hãy chuyển sang tab Đăng ký để tạo tài khoản mới.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold text-foreground">FPT UniTracker</span>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "login" | "register")}>
          <TabsList className="mb-4 grid w-full grid-cols-2 bg-secondary">
            <TabsTrigger value="login">Đăng nhập</TabsTrigger>
            <TabsTrigger value="register">Đăng ký</TabsTrigger>
          </TabsList>

          <TabsContent value="login" className="mt-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="login-phone">Số điện thoại</Label>
                <Input
                  id="login-phone"
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang xử lý..." : "Đăng nhập"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="register" className="mt-0">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="space-y-2">
                <Label htmlFor="reg-phone">Số điện thoại</Label>
                <Input
                  id="reg-phone"
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="tel"
                />
                <p className="text-xs text-muted-foreground">
                  Mỗi SĐT là một tài khoản riêng. Sau khi đăng ký bạn có thể cập nhật hồ sơ cá nhân.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Mật khẩu</Label>
                <Input
                  id="reg-password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="new-password"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang xử lý..." : "Đăng ký"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
