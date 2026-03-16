import {
  LayoutDashboard,
  CalendarDays,
  ListChecks,
  BarChart3,
  Settings,
  ListTodo,
  type LucideIcon,
} from "lucide-react"

export const VIEW_STORAGE_KEY = "unitracker_activeView"

export const navItems: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { id: "tasks", label: "Việc cần làm", icon: ListTodo },
  { id: "timetable", label: "Thời khóa biểu", icon: CalendarDays },
  { id: "progress", label: "Tiến độ", icon: ListChecks },
  { id: "statistics", label: "Thống kê", icon: BarChart3 },
  { id: "profile", label: "Cá nhân", icon: Settings },
]

export const validPaths = navItems.map((n) => `/${n.id}`)
export function getDefaultAppPath(): string {
  if (typeof window === "undefined") return "/dashboard"
  const stored = localStorage.getItem(VIEW_STORAGE_KEY)
  if (stored && validPaths.includes(`/${stored}`)) return `/${stored}`
  return "/dashboard"
}
