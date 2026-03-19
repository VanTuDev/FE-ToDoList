"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ListTodo,
  Plus,
  Trash2,
  CalendarClock,
  Clock,
  CheckCircle2,
  Flame,
  Target,
  Zap,
  BookOpen,
  Calendar,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { DailyTask, StudySchedule } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/constants"
import { cn } from "@/lib/utils"

// ─── Priority config ──────────────────────────────────────────────────────────
const PRIORITY = {
  high:   { label: "Cao",       color: "text-red-400",    bg: "bg-red-500/10",    ring: "ring-red-500/30",    dot: "bg-red-400"    },
  medium: { label: "Vừa",       color: "text-orange-400", bg: "bg-orange-500/10", ring: "ring-orange-500/30", dot: "bg-orange-400" },
  low:    { label: "Thấp",      color: "text-slate-400",  bg: "bg-slate-500/10",  ring: "ring-slate-500/30",  dot: "bg-slate-400"  },
}

export function DailyTasksView() {
  const {
    state, getSubject,
    addDailyTask, toggleDailyTask, deleteDailyTask,
    addStudySchedule, toggleStudySchedule, deleteStudySchedule,
  } = useApp()
  const { dailyTasks, studySchedules, subjects } = state

  const [taskDialogOpen,     setTaskDialogOpen]     = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  const [newTask, setNewTask] = useState({ title: "", priority: "medium" as "high" | "medium" | "low" })
  const [newSchedule, setNewSchedule] = useState({
    subjectId: "", title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "19:00", endTime: "21:00", description: "",
  })

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    try {
      await addDailyTask({ title: newTask.title.trim(), completed: false, priority: newTask.priority, createdAt: new Date().toISOString() })
      setNewTask({ title: "", priority: "medium" })
      setTaskDialogOpen(false)
    } catch { /* handled by context */ }
  }

  const handleAddSchedule = async () => {
    if (!newSchedule.title.trim() || !newSchedule.subjectId) return
    try {
      await addStudySchedule({ ...newSchedule, completed: false })
      setNewSchedule({ subjectId: "", title: "", date: new Date().toISOString().split("T")[0], startTime: "19:00", endTime: "21:00", description: "" })
      setScheduleDialogOpen(false)
      toast.success("Đã thêm lịch học")
    } catch (e) { toast.error(e instanceof Error ? e.message : "Lỗi") }
  }

  const completedTasks     = dailyTasks.filter((t) => t.completed).length
  const totalTasks         = dailyTasks.length
  const completedSchedules = studySchedules.filter((s) => s.completed).length
  const totalSchedules     = studySchedules.length

  const schedulesByDate = studySchedules.reduce((acc, s) => {
    ;(acc[s.date] ??= []).push(s)
    return acc
  }, {} as Record<string, StudySchedule[]>)
  const sortedDates = Object.keys(schedulesByDate).sort()

  const sortedTasks = [...dailyTasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1
    return ({ high: 0, medium: 1, low: 2 }[a.priority]) - ({ high: 0, medium: 1, low: 2 }[b.priority])
  })

  return (
    <div className="flex flex-col gap-5 lg:gap-6">

      {/* ── Summary strip ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Target,      label: "Tổng việc làm",    value: totalTasks,         color: "text-primary"    },
          { icon: CheckCircle2,label: "Đã hoàn thành",    value: completedTasks,     color: "text-green-400"  },
          { icon: Calendar,    label: "Lịch học",         value: totalSchedules,     color: "text-blue-400"   },
          { icon: Zap,         label: "Đang chờ",         value: totalTasks - completedTasks + (totalSchedules - completedSchedules), color: "text-orange-400" },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="rounded-xl border border-border bg-card px-4 py-3 flex items-center gap-3">
            <Icon className={cn("h-4 w-4 shrink-0", color)} />
            <div>
              <p className={cn("text-lg font-bold leading-none", color)}>{value}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Việc cần làm hôm nay ────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <ListTodo className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Việc cần làm hôm nay</CardTitle>
              {totalTasks > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedTasks}/{totalTasks} hoàn thành
                </p>
              )}
            </div>
          </div>
          <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 px-3 text-xs hover:scale-105 transition-transform">
                <Plus className="h-3.5 w-3.5" /> Thêm việc
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <ListTodo className="h-4 w-4 text-primary" /> Thêm việc cần làm
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 pt-1">
                <Input
                  placeholder="Nhập nội dung việc cần làm..."
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="bg-secondary border-border"
                  autoFocus
                />
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium">Độ ưu tiên</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <button
                        key={p}
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                        className={cn(
                          "flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                          newTask.priority === p
                            ? cn(PRIORITY[p].bg, PRIORITY[p].color, "border-current ring-1", PRIORITY[p].ring)
                            : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        <span className={cn("h-1.5 w-1.5 rounded-full", PRIORITY[p].dot)} />
                        {PRIORITY[p].label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddTask} disabled={!newTask.title.trim()} className="gap-1.5">
                  <Plus className="h-4 w-4" /> Thêm việc
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {/* Progress bar */}
        {totalTasks > 0 && (
          <div className="px-6 pb-3">
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-500"
                style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
              />
            </div>
          </div>
        )}

        <CardContent className="pt-0">
          {dailyTasks.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có việc gì hôm nay</p>
              <p className="text-xs text-muted-foreground">Bấm &ldquo;Thêm việc&rdquo; để bắt đầu.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {sortedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  onToggle={() => toggleDailyTask(task.id)}
                  onDelete={() => deleteDailyTask(task.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Lịch học tự đặt ─────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
              <CalendarClock className="h-4 w-4 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-sm font-semibold text-foreground">Lịch học tự đặt</CardTitle>
              {totalSchedules > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {completedSchedules}/{totalSchedules} hoàn thành
                </p>
              )}
            </div>
          </div>
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 px-3 text-xs hover:scale-105 transition-transform" disabled={subjects.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Thêm lịch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-foreground">
                  <CalendarClock className="h-4 w-4 text-blue-400" /> Thêm lịch học tự đặt
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Môn học *</p>
                  <Select value={newSchedule.subjectId} onValueChange={(v) => setNewSchedule({ ...newSchedule, subjectId: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                            {s.code} – {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Nội dung *</p>
                  <Input placeholder="VD: Ôn tập chương 5" value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="bg-secondary border-border" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Ngày</p>
                    <Input type="date" value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Bắt đầu</p>
                    <Input type="time" value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs text-muted-foreground font-medium">Kết thúc</p>
                    <Input type="time" value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs text-muted-foreground font-medium">Ghi chú</p>
                  <Input placeholder="Ghi chú thêm..." value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    className="bg-secondary border-border" />
                </div>
                <Button onClick={handleAddSchedule} disabled={!newSchedule.title.trim() || !newSchedule.subjectId} className="mt-1 gap-1.5">
                  <Plus className="h-4 w-4" /> Thêm lịch học
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>

        {totalSchedules > 0 && (
          <div className="px-6 pb-3">
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-500"
                style={{ width: `${(completedSchedules / totalSchedules) * 100}%` }}
              />
            </div>
          </div>
        )}

        <CardContent className="pt-0">
          {studySchedules.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {subjects.length === 0 ? "Thêm môn học trước để đặt lịch" : "Chưa có lịch học tự đặt"}
              </p>
              <p className="text-xs text-muted-foreground">
                {subjects.length > 0 && "Bấm \"Thêm lịch\" để lên kế hoạch."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {sortedDates.map((date) => {
                const daySchedules = schedulesByDate[date].sort((a, b) => a.startTime.localeCompare(b.startTime))
                const dateObj   = new Date(date)
                const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
                const isToday   = date === new Date().toISOString().split("T")[0]
                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className={cn(
                        "text-[11px] font-bold uppercase tracking-widest",
                        isToday ? "text-primary" : "text-muted-foreground"
                      )}>
                        {dayOfWeek}, {dateObj.getDate()}/{dateObj.getMonth() + 1}
                      </span>
                      {isToday && (
                        <Badge className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary border-primary/30 border">
                          Hôm nay
                        </Badge>
                      )}
                      <div className="flex-1 h-px bg-border" />
                    </div>
                    <div className="flex flex-col gap-2">
                      {daySchedules.map((schedule) => (
                        <ScheduleRow
                          key={schedule.id}
                          schedule={schedule}
                          subject={getSubject(schedule.subjectId)}
                          onToggle={() => toggleStudySchedule(schedule.id)}
                          onDelete={() => deleteStudySchedule(schedule.id)}
                        />
                      ))}
                    </div>
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

// ─── TaskRow ──────────────────────────────────────────────────────────────────
function TaskRow({ task, onToggle, onDelete }: {
  task: DailyTask; onToggle: () => void; onDelete: () => void
}) {
  const p = PRIORITY[task.priority]
  return (
    <div className={cn(
      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200",
      task.completed
        ? "border-border/40 bg-secondary/20 opacity-60"
        : "border-border bg-secondary/40 hover:border-primary/30 hover:bg-secondary/60"
    )}>
      <Checkbox
        checked={task.completed}
        onCheckedChange={onToggle}
        className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm transition-all",
          task.completed ? "text-muted-foreground line-through" : "text-foreground font-medium"
        )}>
          {task.title}
        </p>
      </div>
      {/* Priority indicator */}
      <div className={cn(
        "flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium shrink-0",
        p.bg, p.color
      )}>
        <Flame className="h-2.5 w-2.5" />
        {p.label}
      </div>
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

// ─── ScheduleRow ──────────────────────────────────────────────────────────────
function ScheduleRow({ schedule, subject, onToggle, onDelete }: {
  schedule: StudySchedule
  subject: { code: string; color: string; name: string } | undefined
  onToggle: () => void
  onDelete: () => void
}) {
  return (
    <div className={cn(
      "group flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all duration-200",
      schedule.completed
        ? "border-border/40 bg-secondary/20 opacity-60"
        : "border-border bg-secondary/40 hover:border-blue-500/30 hover:bg-blue-500/5"
    )}>
      <Checkbox
        checked={schedule.completed}
        onCheckedChange={onToggle}
        className="border-border data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500 shrink-0"
      />
      {/* Subject color bar */}
      <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: subject?.color ?? "#666" }} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className={cn(
            "text-sm font-medium",
            schedule.completed ? "text-muted-foreground line-through" : "text-foreground"
          )}>
            {schedule.title}
          </p>
          {subject && (
            <span
              className="hidden sm:inline text-[10px] font-bold px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: `${subject.color}18`, color: subject.color }}
            >
              {subject.code}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {schedule.startTime} – {schedule.endTime}
          </span>
          {schedule.description && (
            <span className="text-[11px] text-muted-foreground truncate">{schedule.description}</span>
          )}
        </div>
      </div>
      {schedule.completed && <CheckCircle2 className="h-4 w-4 text-blue-400 shrink-0" />}
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
