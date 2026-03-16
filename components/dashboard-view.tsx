"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  BookOpen,
  Clock,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { getCalendarEventsForMonth } from "@/lib/constants"

export function DashboardView({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { state, getSubject } = useApp()
  const { profile, subjects, assignments, exams, studyTasks, weeklyPressure } = state

  const totalAssignments = assignments.length
  const completedAssignments = assignments.filter((a) => a.status === "completed").length
  const overdueAssignments = assignments.filter((a) => a.status === "overdue").length

  const totalTasks = studyTasks.length
  const completedTasks = studyTasks.filter((t) => t.completed).length

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const upcomingExams = exams
    .filter((e) => new Date(e.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4)

  const upcomingDeadlines = assignments
    .filter((a) => a.status !== "completed" && new Date(a.deadline) >= today)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
    .slice(0, 5)

  const currentMonth = new Date()
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const currentWeekPressure = weeklyPressure[2] ?? { week: "", label: "Tuần hiện tại", score: 0, assignments: 0, exams: 0 }

  const calendarEvents = getCalendarEventsForMonth(assignments, exams, year, month)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-card from-primary/20 via-primary/10 to-transparent border border-primary/20 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg lg:text-xl font-bold text-foreground">
              Xin chào, {profile.name || "Bạn"}!
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {profile.class && `${profile.class} | `}
              {profile.major && `${profile.major} | `}
              {profile.age > 0 && `${profile.age} tuoi`}
              {!profile.class && !profile.major && (
                <button
                  onClick={() => onNavigate("profile")}
                  className="text-primary hover:underline"
                >
                  Cập nhật thông tin cá nhân
                </button>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {currentWeekPressure.score >= 8 && (
              <Badge
                variant="destructive"
                className="gap-1 bg-destructive/20 text-destructive border-destructive/30"
              >
                <AlertTriangle className="h-3 w-3" />
                Tuan ap luc cao
              </Badge>
            )}
            <Badge variant="secondary" className="gap-1">
              <CalendarClock className="h-3 w-3" />
              Tháng {month + 1}, {year}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/15">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{subjects.length}</p>
                <p className="text-xs text-muted-foreground">Mon hoc</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-success/15">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {completedAssignments}/{totalAssignments}
                </p>
                <p className="text-xs text-muted-foreground">Bài tập</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-destructive/15">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{overdueAssignments}</p>
                <p className="text-xs text-muted-foreground">Qua han</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-chart-5/15">
                <TrendingUp className="h-5 w-5 text-chart-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%
                </p>
                <p className="text-xs text-muted-foreground">Tien do</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 flex flex-col gap-4 lg:gap-6">
          {/* Mini Calendar */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Tháng {month + 1}, {year}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-0.5 text-center">
                {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((d) => (
                  <div key={d} className="text-xs font-medium text-muted-foreground py-1.5">
                    {d}
                  </div>
                ))}
                {Array.from({ length: firstDayOffset }).map((_, i) => (
                  <div key={`empty-${i}`} />
                ))}
                {monthDays.map((day) => {
                  const dayEvents = calendarEvents.filter((e) => e.date === day)
                  const hasExam = dayEvents.some((e) => e.type === "exam")
                  const hasDeadline = dayEvents.some((e) => e.type === "deadline")
                  const isToday =
                    day === today.getDate() &&
                    month === today.getMonth() &&
                    year === today.getFullYear()

                  return (
                    <div
                      key={day}
                      className={`relative flex flex-col items-center py-1 rounded-md text-xs cursor-default ${
                        isToday
                          ? "bg-primary text-primary-foreground font-bold"
                          : day < 17
                          ? "text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {day}
                      {(hasExam || hasDeadline) && (
                        <div className="flex gap-0.5 mt-0.5">
                          {hasExam && <span className="h-1 w-1 rounded-full bg-destructive" />}
                          {hasDeadline && <span className="h-1 w-1 rounded-full bg-warning" />}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-destructive" /> Kỳ thi
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-warning" /> Deadline
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="h-2 w-2 rounded-full bg-primary" /> Hôm nay
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Deadlines */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold text-foreground">
                Deadline sắp tới
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary"
                onClick={() => onNavigate("progress")}
              >
                Xem tất cả <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </CardHeader>
            <CardContent>
              {upcomingDeadlines.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có deadline sắp tới
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingDeadlines.map((a) => {
                    const subject = getSubject(a.subjectId)
                    const deadlineDate = new Date(a.deadline)
                    const daysLeft = Math.ceil(
                      (deadlineDate.getTime() - today.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-primary/10">
                        <div
                          className="h-10 w-1 rounded-full shrink-0"
                          style={{ backgroundColor: subject?.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{a.title}</p>
                          <p className="text-xs text-muted-foreground">{subject?.code}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <Badge
                            variant={daysLeft <= 3 ? "destructive" : "secondary"}
                            className={
                              daysLeft <= 3
                                ? "bg-destructive/20 text-destructive border-destructive/30"
                                : ""
                            }
                          >
                            {daysLeft <= 0 ? "Hôm nay" : `${daysLeft} ngày`}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-4 lg:gap-6">
          {/* Weekly Pressure */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Mức độ áp lực theo tuần
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3">
                {weeklyPressure.map((w, i) => (
                  <div key={w.week} className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span
                        className={`font-medium ${i === 2 ? "text-primary" : "text-muted-foreground"}`}
                      >
                        {w.label} {i === 2 && "(Hiện tại)"}
                      </span>
                      <span
                        className={`font-semibold ${
                          w.score >= 9
                            ? "text-destructive"
                            : w.score >= 7
                            ? "text-warning"
                            : "text-success"
                        }`}
                      >
                        {w.score}/10
                      </span>
                    </div>
                    <Progress value={w.score * 10} className="h-2 bg-secondary" />
                    <p className="text-[10px] text-muted-foreground">
                      {w.assignments} bài tập, {w.exams} kỳ thi
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Exams */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Lich thi sap toi
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingExams.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Không có kỳ thi sắp tới
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {upcomingExams.map((exam) => {
                    const subject = getSubject(exam.subjectId)
                    return (
                      <div
                        key={exam.id}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 transition-colors hover:bg-primary/10"
                      >
                        <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-destructive/15 shrink-0">
                          <Clock className="h-4 w-4 text-destructive" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{exam.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {subject?.code} | {exam.room}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(exam.date).toLocaleDateString("vi-VN", {
                              weekday: "short",
                              day: "numeric",
                              month: "numeric",
                            })}{" "}
                            | {exam.startTime} - {exam.endTime}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="shrink-0 text-xs border-border text-muted-foreground"
                        >
                          {exam.type}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subject Progress */}
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold text-foreground">
                Tiến độ môn học
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subjects.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Chưa có môn học
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {subjects.map((subject) => {
                    const subjectAssignments = assignments.filter(
                      (a) => a.subjectId === subject.id
                    )
                    const completed = subjectAssignments.filter(
                      (a) => a.status === "completed"
                    ).length
                    const total = subjectAssignments.length
                    const pct = total > 0 ? Math.round((completed / total) * 100) : 0
                    return (
                      <div key={subject.id} className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-foreground">
                            {subject.code}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {completed}/{total}
                          </span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-secondary" />
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
