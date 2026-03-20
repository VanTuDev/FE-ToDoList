"use client"

import { cn } from "@/lib/utils"
import { useApp } from "@/lib/app-context"
import {
  CheckCircle2, Clock, Flame, Target, ListTodo, CalendarClock, TrendingUp,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// ─── Donut Chart ──────────────────────────────────────────────────────────────
const R = 52
const CIRC = 2 * Math.PI * R

function DonutChart({
  done, total, label, color = "#f97316",
}: { done: number; total: number; label: string; color?: string }) {
  const pct   = total > 0 ? done / total : 0
  const dash  = pct * CIRC
  const gap   = CIRC - dash
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width="128" height="128" viewBox="0 0 128 128" className="-rotate-90">
          {/* Track */}
          <circle cx="64" cy="64" r={R} fill="none" stroke="currentColor"
            strokeWidth="12" className="text-secondary" />
          {/* Progress */}
          <circle cx="64" cy="64" r={R} fill="none"
            stroke={color} strokeWidth="12"
            strokeDasharray={`${dash} ${gap}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.6s ease" }}
          />
        </svg>
        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-foreground">{total > 0 ? Math.round(pct * 100) : 0}<span className="text-sm">%</span></span>
        </div>
      </div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="text-[11px] text-muted-foreground">{done}/{total} hoàn thành</p>
    </div>
  )
}

// ─── Priority badge ───────────────────────────────────────────────────────────
const PRIO = {
  high:   { label: "Cao",  color: "text-red-400",    bg: "bg-red-500/10"    },
  medium: { label: "Vừa",  color: "text-orange-400", bg: "bg-orange-500/10" },
  low:    { label: "Thấp", color: "text-slate-400",  bg: "bg-slate-500/10"  },
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function ProgressView() {
  const { state, getSubject, toggleDailyTask, toggleStudySchedule } = useApp()
  const { dailyTasks, studySchedules, subjects } = state

  // ── Stats ──────────────────────────────────────────────────────────────────
  const doneDaily     = dailyTasks.filter((t) => t.completed).length
  const doneSched     = studySchedules.filter((s) => s.completed).length
  const totalAll      = dailyTasks.length + studySchedules.length
  const doneAll       = doneDaily + doneSched
  const pendingAll    = totalAll - doneAll

  // Priority breakdown for daily tasks
  const byPriority = {
    high:   dailyTasks.filter((t) => t.priority === "high"),
    medium: dailyTasks.filter((t) => t.priority === "medium"),
    low:    dailyTasks.filter((t) => t.priority === "low"),
  }

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-6">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Tiến độ công việc</h1>
          <p className="text-xs text-muted-foreground">Theo dõi tiến độ và danh sách công việc của bạn</p>
        </div>
      </div>

      {/* ── Donut charts ────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="pt-6 pb-4">
          <div className="grid grid-cols-3 gap-2 sm:gap-6">
            <DonutChart
              done={doneAll} total={totalAll}
              label="Tổng tiến độ" color="#f97316"
            />
            <DonutChart
              done={doneDaily} total={dailyTasks.length}
              label="Việc cần làm" color="#8b5cf6"
            />
            <DonutChart
              done={doneSched} total={studySchedules.length}
              label="Lịch học" color="#06b6d4"
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Summary cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target,       label: "Tổng công việc", value: totalAll,   color: "text-primary",    bg: "bg-primary/10"    },
          { icon: CheckCircle2, label: "Đã hoàn thành",  value: doneAll,    color: "text-green-400",  bg: "bg-green-500/10"  },
          { icon: Clock,        label: "Chưa làm",       value: pendingAll, color: "text-orange-400", bg: "bg-orange-500/10" },
          { icon: Flame,        label: "Ưu tiên cao",    value: byPriority.high.filter((t) => !t.completed).length, color: "text-red-400", bg: "bg-red-500/10" },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className={cn("rounded-xl border border-border p-4 flex items-center gap-3", bg + "/5")}>
            <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", bg)}>
              <Icon className={cn("h-4 w-4", color)} />
            </div>
            <div>
              <p className={cn("text-xl font-bold leading-none", color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Priority breakdown (daily tasks) ─────────────────────────────── */}
      {dailyTasks.length > 0 && (
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <p className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <ListTodo className="h-4 w-4 text-primary" />
              Phân loại theo mức ưu tiên
            </p>
            <div className="flex flex-col gap-3">
              {(["high", "medium", "low"] as const).map((p) => {
                const tasks = byPriority[p]
                if (tasks.length === 0) return null
                const done = tasks.filter((t) => t.completed).length
                const pct  = Math.round((done / tasks.length) * 100)
                return (
                  <div key={p}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={cn("text-xs font-medium flex items-center gap-1.5", PRIO[p].color)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full inline-block", PRIO[p].bg.replace("/10", ""))} />
                        Ưu tiên {PRIO[p].label}
                      </span>
                      <span className="text-xs text-muted-foreground">{done}/{tasks.length} · {pct}%</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: p === "high" ? "#f87171" : p === "medium" ? "#fb923c" : "#94a3b8"
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Danh sách việc cần làm ────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 pb-2">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-primary" />
            Việc cần làm ({doneDaily}/{dailyTasks.length})
          </p>
          {dailyTasks.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">Chưa có việc nào. Thêm ở tab &ldquo;Việc&rdquo;.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {[...dailyTasks]
                .sort((a, b) => {
                  if (a.completed !== b.completed) return a.completed ? 1 : -1
                  return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority])
                })
                .map((task) => (
                  <div key={task.id}
                    className={cn(
                      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                      task.completed ? "border-border/40 bg-secondary/20 opacity-60" : "border-border bg-secondary/40 hover:border-primary/20"
                    )}
                  >
                    <button
                      onClick={() => toggleDailyTask(task.id)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                        task.completed ? "border-green-500 bg-green-500" : "border-border hover:border-primary"
                      )}
                    >
                      {task.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                    </button>
                    <p className={cn("flex-1 text-sm", task.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                      {task.title}
                    </p>
                    <span className={cn("shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full", PRIO[task.priority].bg, PRIO[task.priority].color)}>
                      {PRIO[task.priority].label}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lịch học tự đặt ──────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardContent className="pt-5 pb-2">
          <p className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-cyan-400" />
            Lịch học tự đặt ({doneSched}/{studySchedules.length})
          </p>
          {studySchedules.length === 0 ? (
            <div className="text-center py-8">
              <CalendarClock className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {subjects.length === 0 ? "Thêm môn học ở tab \"Cá nhân\" trước." : "Chưa có lịch học. Thêm ở tab \"Việc\"."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {[...studySchedules]
                .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                .map((s) => {
                  const subject = getSubject(s.subjectId)
                  return (
                    <div key={s.id}
                      className={cn(
                        "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all",
                        s.completed ? "border-border/40 bg-secondary/20 opacity-60" : "border-border bg-secondary/40 hover:border-cyan-500/20"
                      )}
                    >
                      <button
                        onClick={() => toggleStudySchedule(s.id)}
                        className={cn(
                          "h-5 w-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all",
                          s.completed ? "border-cyan-500 bg-cyan-500" : "border-border hover:border-cyan-500"
                        )}
                      >
                        {s.completed && <CheckCircle2 className="h-3.5 w-3.5 text-white" />}
                      </button>
                      {subject && (
                        <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: subject.color }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-sm", s.completed ? "line-through text-muted-foreground" : "text-foreground")}>
                          {s.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {subject?.code} · {s.date.split("-").slice(1).join("/")} · {s.startTime}–{s.endTime}
                        </p>
                      </div>
                      {s.completed && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-cyan-500/10 text-cyan-400 border-cyan-500/20 border shrink-0">
                          Xong
                        </Badge>
                      )}
                    </div>
                  )
                })}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
