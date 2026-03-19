"use client"

/**
 * /auth/setup
 *
 * Trang "Hoàn thiện tài khoản" sau khi đăng nhập Google lần đầu.
 * User điền Số điện thoại + Mật khẩu để sau này có thể đăng nhập bằng phone/password.
 * Có nút "Bỏ qua" nếu không muốn thêm ngay.
 */

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { getUserInfo, setupAccount } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CheckCircle2, Phone, Lock, ArrowRight, SkipForward } from "lucide-react"
import { toast } from "sonner"

export default function SetupPage() {
  const router = useRouter()

  const [userInfo, setUserInfo] = useState<{
    email: string
    name: string
    avatar: string
  } | null>(null)

  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getUserInfo()
      .then((info) => setUserInfo({ email: info.email, name: info.name, avatar: info.avatar }))
      .catch(() => {
        // Token không hợp lệ → về login
        router.replace("/login")
      })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const digits = phone.replace(/\D/g, "")
    if (digits.length < 9 || digits.length > 11) {
      toast.error("Số điện thoại không hợp lệ (9–11 chữ số).")
      return
    }
    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.")
      return
    }
    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.")
      return
    }

    try {
      setLoading(true)
      await setupAccount(phone, password)
      setDone(true)
      toast.success("Đã lưu số điện thoại và mật khẩu!")
      setTimeout(() => router.replace("/dashboard"), 1500)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không lưu được thông tin."
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("setup_skipped", "1")
    }
    router.replace("/dashboard")
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="text-center pb-2">
          {/* Avatar Google */}
          {userInfo?.avatar ? (
            <div className="flex justify-center mb-3">
              <Image
                src={userInfo.avatar}
                alt={userInfo.name || "avatar"}
                width={72}
                height={72}
                className="rounded-full ring-4 ring-orange-500/30"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex justify-center mb-3">
              <div className="h-18 w-18 rounded-full bg-orange-500/20 flex items-center justify-center text-2xl font-bold text-orange-500">
                {userInfo?.name?.charAt(0)?.toUpperCase() || "G"}
              </div>
            </div>
          )}

          <CardTitle className="text-xl font-bold text-foreground">
            Xin chào, {userInfo?.name || "bạn"}! 👋
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Đăng nhập bằng <span className="font-medium text-foreground">{userInfo?.email}</span>
          </CardDescription>
          <p className="text-sm text-muted-foreground mt-2">
            Thêm số điện thoại &amp; mật khẩu để có thể đăng nhập theo 2 cách.
          </p>
        </CardHeader>

        <CardContent className="pt-4">
          {done ? (
            <div className="flex flex-col items-center gap-3 py-6 animate-scale-in">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
              <p className="text-base font-semibold text-foreground">Đã lưu thành công!</p>
              <p className="text-sm text-muted-foreground">Đang chuyển hướng...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {/* Phone */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="phone" className="text-sm font-medium flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-orange-500" />
                  Số điện thoại
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="tel"
                />
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password" className="text-sm font-medium flex items-center gap-1.5">
                  <Lock className="h-3.5 w-3.5 text-orange-500" />
                  Mật khẩu
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="new-password"
                />
              </div>

              {/* Confirm Password */}
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Xác nhận mật khẩu
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-border"
                  autoComplete="new-password"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <Button
                  type="submit"
                  disabled={loading || !phone || !password || !confirmPassword}
                  className="w-full bg-orange-500 hover:bg-orange-400 text-white gap-2"
                >
                  {loading ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      Lưu và tiếp tục
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full text-muted-foreground hover:text-foreground gap-2"
                >
                  <SkipForward className="h-4 w-4" />
                  Bỏ qua, làm sau
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Sau khi thêm SDT, bạn có thể đăng nhập bằng cả Google lẫn SDT/mật khẩu.
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
