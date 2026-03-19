"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  BarChart3,
  Menu,
  X,
  Bell,
  GraduationCap,
  Settings,
  ListTodo,
  LogOut,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { AppProvider, useApp } from "@/lib/app-context"
import { getStoredToken } from "@/lib/api"
import { navItems, VIEW_STORAGE_KEY } from "@/lib/nav-config"
import { ChatBox } from "@/components/chat-box"

function AppShell({ children }: { children: React.ReactNode }) {
  const { state, loading, error, refresh, logout } = useApp()
  const { profile } = state
  const pathname = usePathname()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  // Lưu tab hiện tại vào localStorage khi chuyển route (reload giữ đúng tab)
  useEffect(() => {
    const segment = pathname?.replace(/^\/+/, "").split("/")[0] || "dashboard"
    if (navItems.some((n) => n.id === segment)) {
      if (typeof window !== "undefined") localStorage.setItem(VIEW_STORAGE_KEY, segment)
    }
  }, [pathname])

  const getInitials = (name: string) => {
    if (!name) return "?"
    const parts = name.split(" ")
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }

  const currentLabel = navItems.find((n) => pathname?.startsWith(`/${n.id}`))?.label ?? "Tổng quan"

  if (loading) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background p-4">
        <div className="flex max-w-md flex-col items-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
          <p className="text-sm font-medium text-destructive">{error}</p>
          <p className="text-xs text-muted-foreground">
            Kiểm tra kết nối tới server và MongoDB đã sẵn sàng, rồi thử lại.
          </p>
          <Button onClick={() => refresh()} variant="outline" className="border-destructive/50">
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  const NavLink = ({ item }: { item: (typeof navItems)[0] }) => {
    const href = `/${item.id}`
    const isActive = pathname === href || pathname?.startsWith(href + "/")
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
          isActive ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-primary/15 hover:text-primary"
        )}
      >
        <item.icon className="h-4.5 w-4.5" />
        {item.label}
      </Link>
    )
  }

  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card">
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary">
            <GraduationCap className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">FPT UniTracker</h1>
            <p className="text-xs text-muted-foreground">Spring 2026</p>
          </div>
        </div>
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="flex flex-col gap-1">
            {navItems.map((item) => (
              <li key={item.id}>
                <NavLink item={item} />
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-border">
          <Link
            href="/profile"
            className="flex items-center gap-3 w-full hover:bg-primary/15 rounded-lg p-1.5 -m-1.5 transition-colors"
          >
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                {getInitials(profile.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-medium text-foreground truncate">
                {profile.name || "Chưa cập nhật"}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {profile.class || "Bấm để cập nhật"}
              </p>
            </div>
          </Link>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between h-14 px-4 lg:px-6 border-b border-border bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileNavOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary"
              aria-label="Mở menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary">
                <GraduationCap className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-sm font-semibold text-foreground">FPT UniTracker</span>
            </div>
            <h2 className="hidden lg:block text-lg font-semibold text-foreground">
              {currentLabel}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:bg-primary/15 hover:text-primary"
              aria-label="Thông báo"
            >
              <Bell className="h-4.5 w-4.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={logout}
              className="gap-1.5 border-border text-muted-foreground hover:bg-destructive/15 hover:text-destructive hover:border-destructive/50"
              aria-label="Đăng xuất"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Đăng xuất</span>
            </Button>
            <Link href="/profile" className="lg:hidden">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {getInitials(profile.name)}
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>

        <ChatBox />

        {/* Mobile Bottom Nav - Link để chuyển mượt, không chớp */}
        <nav className="lg:hidden flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-sm pb-[env(safe-area-inset-bottom)]">
          {navItems.slice(0, 5).map((item) => {
            const href = `/${item.id}`
            const isActive = pathname === href
            return (
              <Link
                key={item.id}
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors rounded-lg hover:bg-primary/15",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-primary"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="truncate max-w-[60px]">{item.label.split(" ")[0]}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-background/80 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
          />
          <aside className="relative w-72 bg-card border-r border-border flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary">
                  <GraduationCap className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="text-sm font-semibold text-foreground">FPT UniTracker</span>
              </div>
              <button
                onClick={() => setMobileNavOpen(false)}
                className="p-2 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary"
                aria-label="Đóng menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 p-3 overflow-y-auto">
              <ul className="flex flex-col gap-1">
                {navItems.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/${item.id}`}
                      onClick={() => setMobileNavOpen(false)}
                      className={cn(
                        "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                        pathname === `/${item.id}`
                          ? "bg-primary/15 text-primary"
                          : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                      )}
                    >
                      <item.icon className="h-4.5 w-4.5" />
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
            <div className="p-4 border-t border-border">
              <Link
                href="/profile"
                onClick={() => setMobileNavOpen(false)}
                className="flex items-center gap-3 w-full"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                    {getInitials(profile.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">
                    {profile.name || "Chưa cập nhật"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.class || "Bấm để cập nhật"}{" "}
                    {profile.age > 0 && `| ${profile.age} tuổi`}
                  </p>
                </div>
              </Link>
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

function readAuthFromStorage(): { token: string; userId: string } | null {
  if (typeof window === "undefined") return null
  const token = getStoredToken()
  const userId = localStorage.getItem("unitracker_userId")
  return token && userId ? { token, userId } : null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [auth, setAuth] = useState<{ token: string; userId: string } | null>(null)

  useEffect(() => {
    setAuth(readAuthFromStorage())
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const sync = () => setAuth(readAuthFromStorage())
    window.addEventListener("focus", sync)
    return () => window.removeEventListener("focus", sync)
  }, [mounted])

  // Phải khai báo tất cả hooks TRƯỚC mọi early return (Rules of Hooks).
  // useCallback giữ reference ổn định, tránh AppProvider/refresh bị
  // re-render không cần thiết mỗi khi AppLayout re-render.
  const handleUnauthorized = useCallback(() => {
    router.replace("/login")
  }, [router])

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background" suppressHydrationWarning>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!auth) {
    router.replace("/login")
    return (
      <div className="flex h-dvh items-center justify-center bg-background" suppressHydrationWarning>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <AppProvider onUnauthorized={handleUnauthorized}>
      <AppShell>{children}</AppShell>
    </AppProvider>
  )
}
