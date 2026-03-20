import {
  LayoutDashboard,
  TrendingUp,
  Settings,
  ListTodo,
  Users,
  type LucideIcon,
} from "lucide-react"

export const VIEW_STORAGE_KEY = "unitracker_activeView"

export const navItems: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "tasks", label: "Việc cần làm", icon: ListTodo },
  { id: "progress", label: "Tiến độ", icon: TrendingUp },
  { id: "community", label: "Cộng đồng", icon: Users },
  { id: "profile", label: "Cá nhân", icon: Settings },
]

export const validPaths = navItems.map((n) => `/${n.id}`)
export function getDefaultAppPath(): string {
  if (typeof window === "undefined") return "/dashboard"
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  if (stored && validPaths.includes(`/${stored}`)) return `/${stored}`
  return "/dashboard"
}
