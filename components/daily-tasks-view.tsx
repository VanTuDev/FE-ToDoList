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
  Circle,
  Flame,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { DailyTask, StudySchedule } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/constants"

export function DailyTasksView() {
  const {
    state,
    getSubject,
    addDailyTask,
    toggleDailyTask,
    deleteDailyTask,
    addStudySchedule,
    toggleStudySchedule,
    deleteStudySchedule,
  } = useApp()
  const { dailyTasks, studySchedules, subjects } = state

  const [taskDialogOpen, setTaskDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)

  // New task form
  const [newTask, setNewTask] = useState({
    title: "",
    priority: "medium" as "high" | "medium" | "low",
  })

  // New schedule form
  const [newSchedule, setNewSchedule] = useState({
    subjectId: "",
    title: "",
    date: new Date().toISOString().split("T")[0],
    startTime: "19:00",
    endTime: "21:00",
    description: "",
  })

  const handleAddTask = async () => {
    if (!newTask.title.trim()) return
    try {
      await addDailyTask({
        title: newTask.title.trim(),
        completed: false,
        priority: newTask.priority,
        createdAt: new Date().toISOString(),
      })
      setNewTask({ title: "", priority: "medium" })
      setTaskDialogOpen(false)
    } catch {
      // error handled by context
    }
  }

  const handleAddSchedule = async () => {
    if (!newSchedule.title.trim() || !newSchedule.subjectId) return
    try {
      await addStudySchedule({
        subjectId: newSchedule.subjectId,
        title: newSchedule.title.trim(),
        date: newSchedule.date,
        startTime: newSchedule.startTime,
        endTime: newSchedule.endTime,
        description: newSchedule.description,
        completed: false,
      })
      setNewSchedule({
        subjectId: "",
        title: "",
        date: new Date().toISOString().split("T")[0],
        startTime: "19:00",
        endTime: "21:00",
        description: "",
      })
      setScheduleDialogOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thêm được lịch học"
      toast.error(msg)
    }
  }

  const priorityColors = {
    high: "text-destructive",
    medium: "text-warning",
    low: "text-muted-foreground",
  }

  const completedTasks = dailyTasks.filter((t) => t.completed).length
  const totalTasks = dailyTasks.length

  const completedSchedules = studySchedules.filter((s) => s.completed).length
  const totalSchedules = studySchedules.length

  // Group schedules by date
  const schedulesByDate = studySchedules.reduce((acc, schedule) => {
    const date = schedule.date
    if (!acc[date]) acc[date] = []
    acc[date].push(schedule)
    return acc
  }, {} as Record<string, StudySchedule[]>)

  const sortedDates = Object.keys(schedulesByDate).sort()

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Today's Tasks */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ListTodo className="h-4 w-4 text-primary" />
              Việc cần làm hôm nay
            </CardTitle>
            {totalTasks > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {completedTasks}/{totalTasks} hoan thanh
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-3.5 w-3.5" />
                  Thêm việc
                </Button>
              </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Thêm việc can lam</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Input
                    placeholder="Nhập nội dung việc cần làm..."
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="bg-secondary border-border"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddTask()
                    }}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">Do uu tien:</span>
                  <div className="flex gap-2">
                    {(["high", "medium", "low"] as const).map((p) => (
                      <Button
                        key={p}
                        size="sm"
                        variant={newTask.priority === p ? "default" : "outline"}
                        className={newTask.priority !== p ? "border-border" : ""}
                        onClick={() => setNewTask({ ...newTask, priority: p })}
                      >
                        {p === "high" ? "Cao" : p === "medium" ? "Trung bình" : "Thấp"}
                      </Button>
                    ))}
                  </div>
                </div>
                <Button onClick={handleAddTask} disabled={!newTask.title.trim()}>
                  Thêm việc
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {dailyTasks.length === 0 ? (
            <div className="text-center py-8">
              <Circle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Chua co viec nao. Bam "Thêm việc" để bắt đầu.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dailyTasks
                .sort((a, b) => {
                  // Sort by completed (incomplete first), then by priority
                  if (a.completed !== b.completed) return a.completed ? 1 : -1
                  const priorityOrder = { high: 0, medium: 1, low: 2 }
                  return priorityOrder[a.priority] - priorityOrder[b.priority]
                })
                .map((task) => (
                  <div
                    key={task.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      task.completed ? "bg-secondary/30" : "bg-secondary/50"
                    }`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => toggleDailyTask(task.id)}
                      className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          task.completed
                            ? "text-muted-foreground line-through"
                            : "text-foreground"
                        }`}
                      >
                        {task.title}
                      </p>
                    </div>
                    <Flame className={`h-3.5 w-3.5 shrink-0 ${priorityColors[task.priority]}`} />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => deleteDailyTask(task.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Study Schedules */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarClock className="h-4 w-4 text-primary" />
              Lịch học tự đặt
            </CardTitle>
            {totalSchedules > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {completedSchedules}/{totalSchedules} hoan thanh
              </p>
            )}
          </div>
          <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" disabled={subjects.length === 0}>
                <Plus className="h-3.5 w-3.5" />
                Them lich
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Thêm lịch học tự đặt</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Mon hoc *</span>
                  <Select
                    value={newSchedule.subjectId}
                    onValueChange={(v) => setNewSchedule({ ...newSchedule, subjectId: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.code} - {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Noi dung *</span>
                  <Input
                    placeholder="VD: Ôn tập chương 5"
                    value={newSchedule.title}
                    onChange={(e) => setNewSchedule({ ...newSchedule, title: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Ngay</span>
                    <Input
                      type="date"
                      value={newSchedule.date}
                      onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Bắt đầu</span>
                    <Input
                      type="time"
                      value={newSchedule.startTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-muted-foreground">Kết thúc</span>
                    <Input
                      type="time"
                      value={newSchedule.endTime}
                      onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-muted-foreground">Ghi chu</span>
                  <Input
                    placeholder="Ghi chu them..."
                    value={newSchedule.description}
                    onChange={(e) => setNewSchedule({ ...newSchedule, description: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <Button
                  onClick={handleAddSchedule}
                  disabled={!newSchedule.title.trim() || !newSchedule.subjectId}
                >
                  Thêm lịch học
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {studySchedules.length === 0 ? (
            <div className="text-center py-8">
              <CalendarClock className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                {subjects.length === 0
                  ? "Them mon hoc truoc de dat lich hoc."
                  : "Chưa có lịch học tự đặt. Bấm 'Thêm lịch' để bắt đầu."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {sortedDates.map((date) => {
                const dateSchedules = schedulesByDate[date].sort((a, b) =>
                  a.startTime.localeCompare(b.startTime)
                )
                const dateObj = new Date(date)
                const dayOfWeek = DAYS_OF_WEEK[dateObj.getDay() === 0 ? 6 : dateObj.getDay() - 1]
                const isToday = date === new Date().toISOString().split("T")[0]

                return (
                  <div key={date}>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-xs font-semibold text-muted-foreground">
                        {dayOfWeek}, {dateObj.getDate()}/{dateObj.getMonth() + 1}
                      </p>
                      {isToday && (
                        <Badge variant="secondary" className="text-[10px]">
                          Hom nay
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      {dateSchedules.map((schedule) => {
                        const subject = getSubject(schedule.subjectId)
                        return (
                          <div
                            key={schedule.id}
                            className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                              schedule.completed ? "bg-secondary/30" : "bg-secondary/50"
                            }`}
                          >
                            <Checkbox
                              checked={schedule.completed}
                              onCheckedChange={() => toggleStudySchedule(schedule.id)}
                              className="border-border data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <div
                              className="w-1 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: subject?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`text-sm font-medium ${
                                    schedule.completed
                                      ? "text-muted-foreground line-through"
                                      : "text-foreground"
                                  }`}
                                >
                                  {schedule.title}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-[9px] border-border text-muted-foreground"
                                >
                                  {subject?.code}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                                {schedule.description && (
                                  <span className="truncate">{schedule.description}</span>
                                )}
                              </div>
                            </div>
                            {schedule.completed && (
                              <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => deleteStudySchedule(schedule.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )
                      })}
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
