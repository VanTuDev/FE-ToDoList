"use client"

/**
 * /auth/callback
 *
 * Trang trung gian nhận redirect từ BE sau khi Google OAuth thành công.
 * BE redirect về: /auth/callback?token=JWT&userId=ID
 *
 * Flow:
 *  1. Đọc token + userId từ URL query params
 *  2. Lưu vào localStorage
 *  3. Gọi /api/auth/user-info để kiểm tra user đã có phone chưa
 *  4a. Nếu là Google user CHƯA có phone → redirect /auth/setup (trang điền SDT + mật khẩu)
 *  4b. Đã setup rồi → redirect về /
 */

import { Suspense, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { setAuthStorage, getUserInfo } from "@/lib/api"

function CallbackHandler() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get("token")
    const userId = params.get("userId")

    if (!token || !userId) {
      router.replace("/login")
      return
    }

    setAuthStorage(token, userId)

    // Kiểm tra user đã có phone chưa để quyết định redirect
    getUserInfo()
      .then((info) => {
        if (info.isGoogleUser && !info.hasPhone) {
          // Google user lần đầu đăng nhập → yêu cầu điền SDT + mật khẩu
          router.replace("/auth/setup")
        } else {
          router.replace("/dashboard")
        }
      })
      .catch(() => {
        router.replace("/dashboard")
      })
  }, [params, router])

  return (
    <div className="flex h-dvh items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Đang đăng nhập qua Google...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-dvh items-center justify-center bg-background">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
