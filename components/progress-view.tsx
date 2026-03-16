"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Target,
  ChevronDown,
  ChevronUp,
  ListTodo,
  CalendarClock,
} from "lucide-react"
import { useApp } from "@/lib/app-context"

function getWeekLabel(date: string) {
  const d = parseInt(date.split("-")[2])
  if (d <= 6) return "Tuần 1 (2-6/3)"
  if (d <= 13) return "Tuần 2 (9-13/3)"
  if (d <= 20) return "Tuần 3 (16-20/3)"
  if (d <= 27) return "Tuần 4 (23-27/3)"
  return "Tuần 5 (28-31/3)"
}

function getWeekIndex(date: string) {
  const d = parseInt(date.split("-")[2])
  if (d <= 6) return 0
  if (d <= 13) return 1
  if (d <= 20) return 2
  if (d <= 27) return 3
  return 4
}

const priorityColors = {
  high: "bg-destructive/20 text-destructive border-destructive/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  low: "bg-chart-2/20 text-chart-2 border-chart-2/30",
}

const categoryLabels: Record<string, string> = {
  assignment: "Bài tập",
  study: "Tự học",
  "exam-prep": "Ôn thi",
  lab: "Thực hành",
  project: "Dự án",
}

export function ProgressView() {
  const { state, getSubject, toggleStudyTask, toggleDailyTask, toggleStudySchedule } = useApp()
  const { subjects, assignments, exams, studyTasks, dailyTasks, studySchedules } = state

  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set([2, 3]))
  const [filterSubject, setFilterSubject] = useState<string>("all")

  const toggleWeek = (weekIndex: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev)
      if (next.has(weekIndex)) {
        next.delete(weekIndex)
      } else {
        next.add(weekIndex)
      }
      return next
    })
  }

  const filteredTasks =
    filterSubject === "all"
      ? studyTasks
      : studyTasks.filter((t) => t.subjectId === filterSubject)

  const weekGroups = filteredTasks.reduce<Record<string, typeof filteredTasks>>((acc, task) => {
    const week = getWeekLabel(task.date)
    if (!acc[week]) acc[week] = []
    acc[week].push(task)
    return acc
  }, {})

  // Tổng tiến độ gồm: nhiệm vụ theo tuần + việc cần làm + lịch học tự đặt
  const totalTasks =
    studyTasks.length + dailyTasks.length + studySchedules.length
  const completedTasks =
    studyTasks.filter((t) => t.completed).length +
    dailyTasks.filter((t) => t.completed).length +
    studySchedules.filter((s) => s.completed).length
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Warnings
  const warnings: Array<{ type: "danger" | "warning"; message: string }> = []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const overdueAssignments = assignments.filter((a) => a.status === "overdue")
  overdueAssignments.forEach((a) => {
    const subject = getSubject(a.subjectId)
    warnings.push({
      type: "danger",
      message: `${subject?.code}: "${a.title}" đã quá hạn! Nộp ngay!`,
    })
  })

  const upcomingExams = exams.filter((e) => {
    const examDate = new Date(e.date)
    const today = new Date("2026-03-17")
    const daysUntil = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return daysUntil > 0 && daysUntil <= 7
  })

  upcomingExams.forEach((e) => {
    const subject = getSubject(e.subjectId)
    const prepTasks = studyTasks.filter(
      (t) => t.subjectId === e.subjectId && t.category === "exam-prep" && !t.completed
    )
    if (prepTasks.length > 0) {
      warnings.push({
        type: "warning",
        message: `${subject?.code} ${e.type} sap dien ra (${e.date.split("-")[2]}/3). Bạn chưa hoàn thành ôn tập!`,
      })
    }
  })

  const inProgressAssignments = assignments.filter((a) => a.status === "in-progress")
  inProgressAssignments.forEach((a) => {
    const deadlineDate = new Date(a.deadline)
    const daysLeft = Math.ceil(
      (deadlineDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (daysLeft <= 3) {
      const subject = getSubject(a.subjectId)
      warnings.push({
        type: "warning",
        message: `${subject?.code}: "${a.title}" còn ${daysLeft} ngày. Tăng tốc!`,
      })
    }
  })

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Overall progress */}
      <Card className="bg-card border-border">
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative h-16 w-16 shrink-0">
                <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-secondary"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-primary"
                    strokeDasharray={`${progressPct * 1.76} 176`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-foreground">
                  {progressPct}%
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Tiến độ tháng 3</h3>
                <p className="text-sm text-muted-foreground">
                  {completedTasks}/{totalTasks} nhiệm vụ hoàn thành
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 lg:gap-6">
              <div className="text-center">
                <p className="text-lg font-bold text-success">{completedTasks}</p>
                <p className="text-[10px] text-muted-foreground">Hoàn thành</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-warning">
                  {studyTasks.filter((t) => !t.completed && getWeekIndex(t.date) <= 2).length +
                    dailyTasks.filter((t) => !t.completed).length +
                    studySchedules.filter((s) => !s.completed).length}
                </p>
                <p className="text-[10px] text-muted-foreground">Đang làm</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-muted-foreground">
                  {studyTasks.filter((t) => !t.completed && getWeekIndex(t.date) > 2).length}
                </p>
                <p className="text-[10px] text-muted-foreground">Sắp tới</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="flex flex-col gap-2">
          {warnings.map((w, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                w.type === "danger"
                  ? "bg-destructive/10 border-destructive/30"
                  : "bg-warning/10 border-warning/30"
              }`}
            >
              {w.type === "danger" ? (
                <Flame className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${w.type === "danger" ? "text-destructive" : "text-warning"}`}>
                {w.message}
              </p>
            </div>
          ))}
        </div>
      )}

      <Tabs defaultValue="tasks">
        <TabsList className="bg-secondary">
          <TabsTrigger value="tasks">Lịch trình</TabsTrigger>
          <TabsTrigger value="mine">Việc của tôi</TabsTrigger>
          <TabsTrigger value="assignments">Bài tập</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="mt-4">
          {/* Subject filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            <button
              onClick={() => setFilterSubject("all")}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                filterSubject === "all"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Tất cả
            </button>
            {subjects.map((s) => (
              <button
                key={s.id}
                onClick={() => setFilterSubject(s.id)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  filterSubject === s.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                {s.code}
              </button>
            ))}
          </div>

          {/* Weekly task groups (nhiệm vụ theo tuần từ seed/API) */}
          <div className="flex flex-col gap-3">
            {Object.keys(weekGroups).length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Chưa có nhiệm vụ theo tuần. Xem tab &quot;Việc của tôi&quot; để theo dõi việc cần làm và lịch học tự đặt.
              </p>
            ) : (
              Object.entries(weekGroups)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([week, weekTasks]) => {
                const weekIndex = getWeekIndex(weekTasks[0].date)
                const isExpanded = expandedWeeks.has(weekIndex)
                const weekCompleted = weekTasks.filter((t) => t.completed).length
                const weekTotal = weekTasks.length
                const weekPct = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0
                const isCurrent = weekIndex === 2

                return (
                  <Card
                    key={week}
                    className={`bg-card border-border ${isCurrent ? "ring-1 ring-primary/30" : ""}`}
                  >
                    <button
                      onClick={() => toggleWeek(weekIndex)}
                      className="w-full p-4 flex items-center justify-between rounded-lg transition-colors hover:bg-primary/10"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-foreground text-left">
                              {week}
                            </h3>
                            {isCurrent && (
                              <Badge
                                className="text-[10px] bg-primary/20 text-primary border-primary/30"
                                variant="outline"
                              >
                                Hiện tại
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 text-left">
                            {weekCompleted}/{weekTotal} nhiệm vụ | {weekPct}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={weekPct}
                          className="h-1.5 w-16 bg-secondary hidden sm:block"
                        />
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>
                    {isExpanded && (
                      <CardContent className="pt-0 pb-4 px-4">
                        <div className="flex flex-col gap-2 border-t border-border pt-3">
                          {weekTasks
                            .sort((a, b) => a.date.localeCompare(b.date))
                            .map((task) => {
                              const subject = getSubject(task.subjectId)
                              return (
                                <div
                                  key={task.id}
                                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-primary/10 ${
                                    task.completed ? "bg-success/5 opacity-80" : "bg-secondary/50"
                                  }`}
                                >
                                  <Checkbox
                                    checked={task.completed}
                                    onCheckedChange={() => toggleStudyTask(task.id)}
                                    className="border-border data-[state=checked]:bg-success data-[state=checked]:border-success"
                                  />
                                  <div
                                    className="h-8 w-1 rounded-full shrink-0"
                                    style={{ backgroundColor: subject?.color }}
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p
                                      className={`text-sm font-medium ${
                                        task.completed
                                          ? "line-through text-muted-foreground"
                                          : "text-foreground"
                                      }`}
                                    >
                                      {task.title}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[10px] text-muted-foreground">
                                        {subject?.code}
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">|</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        {parseInt(task.date.split("-")[2])}/3
                                      </span>
                                      <span className="text-[10px] text-muted-foreground">|</span>
                                      <span className="text-[10px] text-muted-foreground">
                                        ~{task.estimatedMinutes} phút
                                      </span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <Badge
                                      variant="outline"
                                      className={`text-[10px] ${priorityColors[task.priority]}`}
                                    >
                                      {task.priority === "high"
                                        ? "Cao"
                                        : task.priority === "medium"
                                        ? "TB"
                                        : "Thấp"}
                                    </Badge>
                                    <Badge
                                      variant="outline"
                                      className="text-[10px] border-border text-muted-foreground hidden sm:inline-flex"
                                    >
                                      {categoryLabels[task.category]}
                                    </Badge>
                                  </div>
                                </div>
                              )
                            })}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                )
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-4">
          <div className="flex flex-col gap-6">
            {/* Việc cần làm (tạo từ màn Việc cần làm) */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center gap-2">
                  <ListTodo className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Việc cần làm
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {dailyTasks.filter((t) => t.completed).length}/{dailyTasks.length} hoàn thành
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {dailyTasks.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Chưa có việc nào. Thêm ở màn &quot;Việc cần làm&quot;.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {dailyTasks
                      .sort((a, b) => {
                        if (a.completed !== b.completed) return a.completed ? 1 : -1
                        const order = { high: 0, medium: 1, low: 2 }
                        return order[a.priority] - order[b.priority]
                      })
                      .map((task) => (
                        <div
                          key={task.id}
                          className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-primary/10 ${
                            task.completed ? "bg-success/5 opacity-80" : "bg-secondary/50"
                          }`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={() => toggleDailyTask(task.id)}
                            className="border-border data-[state=checked]:bg-success data-[state=checked]:border-success"
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium ${
                                task.completed
                                  ? "line-through text-muted-foreground"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-[10px] shrink-0 ${priorityColors[task.priority]}`}
                          >
                            {task.priority === "high" ? "Cao" : task.priority === "medium" ? "TB" : "Thấp"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Lịch học tự đặt */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2 p-4">
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm font-semibold text-foreground">
                    Lịch học tự đặt
                  </CardTitle>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {studySchedules.filter((s) => s.completed).length}/{studySchedules.length} hoàn thành
                </p>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {studySchedules.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">
                    Chưa có lịch học. Thêm ở màn &quot;Việc cần làm&quot; → Lịch học tự đặt.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {studySchedules
                      .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                      .map((schedule) => {
                        const subject = getSubject(schedule.subjectId)
                        return (
                          <div
                            key={schedule.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-primary/10 ${
                              schedule.completed ? "bg-success/5 opacity-80" : "bg-secondary/50"
                            }`}
                          >
                            <Checkbox
                              checked={schedule.completed}
                              onCheckedChange={() => toggleStudySchedule(schedule.id)}
                              className="border-border data-[state=checked]:bg-success data-[state=checked]:border-success"
                            />
                            <div
                              className="h-8 w-1 rounded-full shrink-0"
                              style={{ backgroundColor: subject?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  schedule.completed
                                    ? "line-through text-muted-foreground"
                                    : "text-foreground"
                                }`}
                              >
                                {schedule.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {subject?.code} · {schedule.date} · {schedule.startTime}-{schedule.endTime}
                              </p>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="assignments" className="mt-4">
          <div className="flex flex-col gap-3">
            {subjects.map((subject) => {
              const subjectAssignments = assignments.filter((a) => a.subjectId === subject.id)
              if (subjectAssignments.length === 0) return null
              return (
                <Card key={subject.id} className="bg-card border-border">
                  <CardHeader className="pb-2 p-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <CardTitle className="text-sm font-semibold text-foreground">
                        {subject.code} - {subject.name}
                      </CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <div className="flex flex-col gap-2">
                      {subjectAssignments.map((a) => {
                        const deadlineDate = new Date(a.deadline)
                        const statusConfig = {
                          completed: {
                            icon: CheckCircle2,
                            color: "text-success",
                            bg: "bg-success/10",
                            label: "Hoàn thành",
                          },
                          "in-progress": {
                            icon: Clock,
                            color: "text-warning",
                            bg: "bg-warning/10",
                            label: "Dang lam",
                          },
                          "not-started": {
                            icon: Target,
                            color: "text-muted-foreground",
                            bg: "bg-secondary",
                            label: "Chưa bắt đầu",
                          },
                          overdue: {
                            icon: AlertTriangle,
                            color: "text-destructive",
                            bg: "bg-destructive/10",
                            label: "Quá hạn",
                          },
                        }
                        const config = statusConfig[a.status]
                        const StatusIcon = config.icon

                        return (
                          <div
                            key={a.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-primary/10 ${config.bg}`}
                          >
                            <StatusIcon className={`h-4 w-4 ${config.color} shrink-0`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {a.title}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                DL: {deadlineDate.toLocaleDateString("vi-VN")} | Trọng số:{" "}
                                {a.weight}%
                              </p>
                            </div>
                            <Badge
                              variant="outline"
                              className={`text-[10px] shrink-0 ${
                                a.status === "overdue"
                                  ? "border-destructive/30 text-destructive"
                                  : a.status === "completed"
                                  ? "border-success/30 text-success"
                                  : a.status === "in-progress"
                                  ? "border-warning/30 text-warning"
                                  : "border-border text-muted-foreground"
                              }`}
                            >
                              {config.label}
                            </Badge>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
