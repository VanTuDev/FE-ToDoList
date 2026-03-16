"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Tooltip as RechartsTooltip,
} from "recharts"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  TrendingUp,
  Clock,
  AlertTriangle,
  Zap,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { StudySession, StudyTimeByHour, DeadlineStat, WeeklyPressure } from "@/lib/types"

/** Tính phút từ "HH:mm" - "HH:mm" */
function parseDuration(start: string, end: string): number {
  const [sh, sm] = start.split(":").map(Number)
  const [eh, em] = end.split(":").map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

/** Lấy tuần ISO (vd: "2026-W10") từ date string */
function getWeekKey(dateStr: string): string {
  const d = new Date(dateStr)
  const start = new Date(d)
  start.setDate(d.getDate() - d.getDay() + 1)
  const y = start.getFullYear()
  const w = Math.ceil((d.getTime() - start.getTime()) / 86400000 / 7) || 1
  return `${y}-W${String(w).padStart(2, "0")}`
}

/** Tính thống kê từ studySchedules, studyTasks, subjects */
function computeStats(state: {
  subjects: { id: string; code: string }[]
  studySchedules: { subjectId: string; date: string; startTime: string; endTime: string; completed: boolean }[]
  studyTasks: { subjectId: string; date: string; completed: boolean; estimatedMinutes: number; category: string }[]
}) {
  const { subjects, studySchedules, studyTasks } = state
  const codeById: Record<string, string> = {}
  subjects.forEach((s) => { codeById[s.id] = s.code })

  const studySessions: StudySession[] = studySchedules
    .filter((s) => s.completed)
    .map((s, i) => ({
      id: `ss-${i}`,
      subjectId: s.subjectId,
      date: s.date,
      duration: Math.max(0, parseDuration(s.startTime, s.endTime)),
      type: "practice" as const,
    }))
  studyTasks
    .filter((t) => t.completed && t.estimatedMinutes > 0)
    .forEach((t, i) => {
      const type = t.category === "assignment" ? "assignment" : t.category === "lab" ? "practice" : t.category === "exam-prep" ? "review" : "reading"
      studySessions.push({
        id: `st-${i}`,
        subjectId: t.subjectId,
        date: t.date,
        duration: t.estimatedMinutes,
        type,
      })
    })

  const hourSlots: StudyTimeByHour[] = Array.from({ length: 24 }, (_, h) => ({
    hour: `${String(h).padStart(2, "0")}:00`,
    minutes: 0,
  }))
  studySchedules
    .filter((s) => s.completed)
    .forEach((s) => {
      const mins = parseDuration(s.startTime, s.endTime)
      const hour = parseInt(s.startTime.split(":")[0], 10)
      if (hour >= 0 && hour < 24) hourSlots[hour].minutes += mins
    })
  studyTasks
    .filter((t) => t.completed && t.estimatedMinutes > 0)
    .forEach((t) => {
      const hour = 14
      hourSlots[hour].minutes += t.estimatedMinutes
    })

  const today = new Date().toISOString().slice(0, 10)
  const deadlineStats: DeadlineStat[] = subjects.map((s) => {
    const tasks = studyTasks.filter((t) => t.subjectId === s.id)
    const total = tasks.length
    const onTime = tasks.filter((t) => t.completed).length
    const missed = tasks.filter((t) => !t.completed && t.date < today).length
    const late = Math.max(0, total - onTime - missed)
    return {
      subject: s.code,
      total,
      onTime,
      late,
      missed,
    }
  }).filter((d) => d.total > 0)

  const weekMap = new Map<string, { tasks: number; schedules: number }>()
  studyTasks.forEach((t) => {
    const w = getWeekKey(t.date)
    const cur = weekMap.get(w) || { tasks: 0, schedules: 0 }
    cur.tasks += 1
    weekMap.set(w, cur)
  })
  studySchedules.forEach((s) => {
    const w = getWeekKey(s.date)
    const cur = weekMap.get(w) || { tasks: 0, schedules: 0 }
    cur.schedules += 1
    weekMap.set(w, cur)
  })
  const weeklyPressure: WeeklyPressure[] = Array.from(weekMap.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([week, v]) => {
      const count = v.tasks + v.schedules
      const score = Math.min(10, Math.max(1, Math.ceil(count / 2)))
      return {
        week,
        label: `Tuần ${week.split("-W")[1] || week}`,
        score,
        assignments: v.tasks,
        exams: v.schedules,
      }
    })

  return { studySessions, studyTimeByHour: hourSlots, deadlineStats, weeklyPressure }
}

// Compute colors in JS for Recharts
const ORANGE = "#e8913a"
const TEAL = "#4db89e"
const BLUE = "#6c8cd5"
const PINK = "#d47ba6"
const CYAN = "#5ba8c8"
const RED = "#d4574e"
const YELLOW = "#d4c34e"
const GREEN = "#5bc46e"

const subjectColors: Record<string, string> = {
  SWP391: ORANGE,
  SWR302: TEAL,
  SWT301: BLUE,
  PRN231: PINK,
  MLN131: CYAN,
}

export function StatisticsView() {
  const { state } = useApp()
  const { subjects, studySchedules, studyTasks } = state

  const { studySessions, studyTimeByHour, deadlineStats, weeklyPressure } = useMemo(
    () => computeStats({ subjects, studySchedules, studyTasks }),
    [subjects, studySchedules, studyTasks]
  )

  // Study time distribution by subject
  const studyBySubject = subjects.map((s) => {
    const totalMinutes = studySessions
      .filter((ss) => ss.subjectId === s.id)
      .reduce((sum, ss) => sum + ss.duration, 0)
    return {
      name: s.code,
      hours: Math.round(totalMinutes / 60 * 10) / 10,
      fill: subjectColors[s.code] || subjectColors[s.id] || ORANGE,
    }
  })

  // Study time by hour of day
  const hourlyData = studyTimeByHour.map((h) => ({
    hour: h.hour.split(":")[0] + "h",
    minutes: h.minutes,
  }))

  // Deadline compliance
  const deadlineData = deadlineStats.map((d) => ({
    name: d.subject,
    "Dung han": d.onTime,
    "Tre han": d.late,
    "Qua han": d.missed,
    fill: subjectColors[d.subject] || ORANGE,
  }))

  // Weekly pressure
  const pressureData = weeklyPressure.map((w) => ({
    name: w.label,
    score: w.score,
    baiTap: w.assignments,
    kyThi: w.exams,
  }))

  // Study type distribution
  const studyTypeData = [
    {
      name: "Thực hành",
      value: studySessions.filter((s) => s.type === "practice").reduce((sum, s) => sum + s.duration, 0),
      fill: ORANGE,
    },
    {
      name: "Bài tập",
      value: studySessions.filter((s) => s.type === "assignment").reduce((sum, s) => sum + s.duration, 0),
      fill: TEAL,
    },
    {
      name: "On tap",
      value: studySessions.filter((s) => s.type === "review").reduce((sum, s) => sum + s.duration, 0),
      fill: BLUE,
    },
    {
      name: "Đọc tài liệu",
      value: studySessions.filter((s) => s.type === "reading").reduce((sum, s) => sum + s.duration, 0),
      fill: PINK,
    },
  ]

  const totalStudyHours = Math.round(
    studySessions.reduce((sum, s) => sum + s.duration, 0) / 60
  )

  // Peak study hour (mảng rỗng thì dùng giá trị mặc định)
  const peakHour = studyTimeByHour.length > 0
    ? studyTimeByHour.reduce((max, h) => (h.minutes > max.minutes ? h : max))
    : { hour: "00:00", minutes: 0 }

  // Most late subject
  const mostLateSubject = deadlineStats.length > 0
    ? deadlineStats.reduce((max, d) =>
        (d.late + d.missed) > (max.late + max.missed) ? d : max
      )
    : { subject: "-", onTime: 0, late: 0, missed: 0, total: 0 }

  // Highest pressure week
  const highestPressureWeek = weeklyPressure.length > 0
    ? weeklyPressure.reduce((max, w) => (w.score > max.score ? w : max))
    : { week: "", label: "-", score: 0, assignments: 0, exams: 0 }

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/15">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalStudyHours}h</p>
                <p className="text-xs text-muted-foreground">Tổng thời gian học</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-chart-2/15">
                <TrendingUp className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{peakHour.hour.split(":")[0]}h</p>
                <p className="text-xs text-muted-foreground">Giờ học nhiều nhất</p>
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
                <p className="text-2xl font-bold text-foreground">{mostLateSubject.subject}</p>
                <p className="text-xs text-muted-foreground">Trễ hạn nhiều nhất</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-warning/15">
                <Zap className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{highestPressureWeek.label}</p>
                <p className="text-xs text-muted-foreground">Tuần áp lực nhất</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="time">
        <TabsList className="bg-secondary">
          <TabsTrigger value="time">Thời gian</TabsTrigger>
          <TabsTrigger value="deadline">Deadline</TabsTrigger>
          <TabsTrigger value="pressure">Áp lực</TabsTrigger>
        </TabsList>

        <TabsContent value="time" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            {/* Study by hour */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Thoi diem hoc tap trong ngay
                </CardTitle>
                <p className="text-xs text-muted-foreground">Phân bố thời gian học theo giờ (phút)</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    minutes: { label: "Phut", color: ORANGE },
                  }}
                  className="h-[250px] lg:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={hourlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="hour"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <defs>
                        <linearGradient id="colorMinutes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={ORANGE} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={ORANGE} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="minutes"
                        stroke={ORANGE}
                        fillOpacity={1}
                        fill="url(#colorMinutes)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="mt-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-xs text-foreground font-medium">Nhận xét</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ban thuong hoc nhieu nhat vao buoi toi (20h-22h). Gio hoc chieu (14h-15h) cung hieu qua. Nen duy tri lich nay!
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Study by subject */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Thời gian học theo môn
                </CardTitle>
                <p className="text-xs text-muted-foreground">Số giờ đã học cho từng môn (giờ)</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    hours: { label: "Gio", color: ORANGE },
                  }}
                  className="h-[250px] lg:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyBySubject} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="hours" radius={[4, 4, 0, 0]}>
                        {studyBySubject.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
                <div className="flex flex-wrap gap-2 mt-3">
                  {studyBySubject.map((s) => (
                    <div key={s.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.fill }} />
                      {s.name}: {s.hours}h
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Study type breakdown */}
            <Card className="bg-card border-border lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Phan bo loai hinh hoc tap
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col lg:flex-row items-center gap-6">
                  <ChartContainer
                    config={{
                      value: { label: "Phut" },
                    }}
                    className="h-[200px] w-[200px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={studyTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {studyTypeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          contentStyle={{
                            backgroundColor: "rgba(30,30,50,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "12px",
                          }}
                          formatter={(value: number) => [`${Math.round(value / 60 * 10) / 10}h`, ""]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                  <div className="flex flex-wrap lg:flex-col gap-3">
                    {studyTypeData.map((item) => (
                      <div key={item.name} className="flex items-center gap-3">
                        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: item.fill }} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{item.name}</p>
                          <p className="text-xs text-muted-foreground">{Math.round(item.value / 60 * 10) / 10} giờ</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="deadline" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Tỉ lệ nộp bài theo môn
                </CardTitle>
                <p className="text-xs text-muted-foreground">Dung han / Tre han / Qua han</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    "Dung han": { label: "Dung han", color: GREEN },
                    "Tre han": { label: "Tre han", color: YELLOW },
                    "Qua han": { label: "Qua han", color: RED },
                  }}
                  className="h-[280px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={deadlineData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="Dung han" stackId="a" fill={GREEN} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Tre han" stackId="a" fill={YELLOW} radius={[0, 0, 0, 0]} />
                      <Bar dataKey="Qua han" stackId="a" fill={RED} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Chi tiết trạng thái deadline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {deadlineStats.map((d) => {
                    const total = d.onTime + d.late + d.missed
                    return (
                      <div key={d.subject} className="p-3 rounded-lg bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: subjectColors[d.subject] }} />
                            <span className="text-sm font-medium text-foreground">{d.subject}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{total}/{d.total} da nop</span>
                        </div>
                        <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                          {d.onTime > 0 && (
                            <div
                              className="rounded-full"
                              style={{ width: `${(d.onTime / d.total) * 100}%`, backgroundColor: GREEN }}
                            />
                          )}
                          {d.late > 0 && (
                            <div
                              className="rounded-full"
                              style={{ width: `${(d.late / d.total) * 100}%`, backgroundColor: YELLOW }}
                            />
                          )}
                          {d.missed > 0 && (
                            <div
                              className="rounded-full"
                              style={{ width: `${(d.missed / d.total) * 100}%`, backgroundColor: RED }}
                            />
                          )}
                          <div className="flex-1 rounded-full bg-secondary" />
                        </div>
                        <div className="flex gap-4 mt-2 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: GREEN }} />
                            Đúng hạn: {d.onTime}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: YELLOW }} />
                            Tre: {d.late}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: RED }} />
                            Quá hạn: {d.missed}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="pressure" className="mt-4">
          <div className="grid lg:grid-cols-2 gap-4 lg:gap-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Du doan ap luc theo tuan
                </CardTitle>
                <p className="text-xs text-muted-foreground">Điểm áp lực (1-10) dựa trên số bài tập và kỳ thi</p>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    score: { label: "Áp lực", color: ORANGE },
                    baiTap: { label: "Bài tập", color: TEAL },
                    kyThi: { label: "Ky thi", color: RED },
                  }}
                  className="h-[280px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={pressureData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis
                        dataKey="name"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        domain={[0, 10]}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {pressureData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.score >= 9 ? RED : entry.score >= 7 ? YELLOW : GREEN}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Phan tich ap luc chi tiet
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-3">
                  {weeklyPressure.map((w, i) => {
                    const isCurrent = i === 2
                    return (
                      <div
                        key={w.week}
                        className={`p-3 rounded-lg ${
                          isCurrent ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-foreground">{w.label}</span>
                            {isCurrent && (
                              <Badge className="text-[10px] bg-primary/20 text-primary border-primary/30" variant="outline">
                                Hiện tại
                              </Badge>
                            )}
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${
                              w.score >= 9
                                ? "border-destructive/30 text-destructive"
                                : w.score >= 7
                                ? "border-warning/30 text-warning"
                                : "border-success/30 text-success"
                            }`}
                          >
                            {w.score}/10
                          </Badge>
                        </div>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>{w.assignments} bài tập</span>
                          <span>{w.exams} ky thi</span>
                        </div>
                        {w.score >= 9 && (
                          <p className="text-xs text-destructive mt-2 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Tuần này rất áp lực! Hãy lên kế hoạch sớm.
                          </p>
                        )}
                        {w.score >= 7 && w.score < 9 && (
                          <p className="text-xs text-warning mt-2 flex items-center gap-1">
                            <Zap className="h-3 w-3" />
                            Áp lực trung bình cao. Cần chú ý sức khỏe.
                          </p>
                        )}
                      </div>
                    )
                  })}
                </div>

                <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-xs text-destructive font-medium flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Cảnh báo: Tuần 4 (23-27/3) là đỉnh áp lực!
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    5 bài tập + 2 ky thi. Nen bat dau chuan bi tu Tuan 3 de giam tai.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
