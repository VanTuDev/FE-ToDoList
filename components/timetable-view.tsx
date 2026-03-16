"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MapPin, Clock, User } from "lucide-react"
import { useApp } from "@/lib/app-context"
import { DAYS_OF_WEEK } from "@/lib/constants"

export function TimetableView() {
  const { state, getSubject } = useApp()
  const { timetable, subjects, exams } = state

  const [selectedDay, setSelectedDay] = useState(0)

  const todaySlots = timetable
    .filter((s) => s.day === selectedDay)
    .sort((a, b) => a.startTime.localeCompare(b.startTime))

  const marchExams = exams.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      <Tabs defaultValue="weekly" className="w-full">
        <TabsList className="bg-secondary">
          <TabsTrigger value="weekly">Thời khóa biểu</TabsTrigger>
          <TabsTrigger value="exams">Lich thi</TabsTrigger>
          <TabsTrigger value="rooms">Phong hoc</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="mt-4">
          {/* Day selector */}
          <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
            {DAYS_OF_WEEK.slice(0, 6).map((day, i) => {
              const daySlots = timetable.filter((s) => s.day === i)
              return (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center px-4 py-2 rounded-lg text-sm font-medium shrink-0 transition-colors ${
                    selectedDay === i
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-primary/20 hover:text-primary"
                  }`}
                >
                  <span className="text-xs opacity-80">{day}</span>
                  <span className="text-lg font-bold">{2 + i}</span>
                  {daySlots.length > 0 && (
                    <span
                      className={`h-1 w-1 rounded-full mt-0.5 ${
                        selectedDay === i ? "bg-primary-foreground" : "bg-primary"
                      }`}
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Schedule for selected day */}
          {todaySlots.length > 0 ? (
            <div className="flex flex-col gap-3">
              {todaySlots.map((slot) => {
                const subject = getSubject(slot.subjectId)
                return (
                  <Card key={slot.id} className="bg-card border-border overflow-hidden">
                    <div className="flex">
                      <div
                        className="w-1.5 shrink-0"
                        style={{ backgroundColor: subject?.color }}
                      />
                      <CardContent className="flex-1 p-4">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-foreground">
                                {subject?.code}
                              </h3>
                              <Badge
                                variant="outline"
                                className="text-[10px] uppercase border-border text-muted-foreground"
                              >
                                {slot.type}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{subject?.name}</p>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {slot.room}
                            </span>
                            {subject?.instructor && (
                              <span className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {subject.instructor}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Không có lịch học vào {DAYS_OF_WEEK[selectedDay]}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Full week overview (desktop) */}
          <div className="hidden lg:block mt-6">
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">
                  Tổng quan cả tuần
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-2">
                  {DAYS_OF_WEEK.map((day, i) => {
                    const daySlots = timetable
                      .filter((s) => s.day === i)
                      .sort((a, b) => a.startTime.localeCompare(b.startTime))
                    return (
                      <div key={i} className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-center text-muted-foreground py-1.5 border-b border-border">
                          {day}
                        </div>
                        {daySlots.length > 0 ? (
                          daySlots.map((slot) => {
                            const subject = getSubject(slot.subjectId)
                            return (
                              <div
                                key={slot.id}
                                className="rounded-md p-1.5 text-[10px]"
                                style={{
                                  backgroundColor: `${subject?.color}20`,
                                  color: subject?.color,
                                }}
                              >
                                <div className="font-semibold">{subject?.code}</div>
                                <div className="opacity-80">{slot.startTime}</div>
                                <div className="opacity-70">{slot.room}</div>
                              </div>
                            )
                          })
                        ) : (
                          <div className="text-[10px] text-muted-foreground text-center py-4">
                            --
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="exams" className="mt-4">
          {marchExams.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Chua co lich thi</p>
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-3">
              {marchExams.map((exam) => {
                const subject = getSubject(exam.subjectId)
                const examDate = new Date(exam.date)
                const isPast = examDate < new Date()
                return (
                  <Card
                    key={exam.id}
                    className={`bg-card border-border ${isPast ? "opacity-60" : ""}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col items-center justify-center h-14 w-14 rounded-lg bg-secondary shrink-0">
                          <span className="text-lg font-bold text-foreground leading-none">
                            {examDate.getDate()}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            Thg {examDate.getMonth() + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-foreground">{exam.title}</h3>
                            <Badge
                              className={`text-[10px] ${
                                exam.type === "FE"
                                  ? "bg-destructive/20 text-destructive border-destructive/30"
                                  : exam.type === "PT"
                                  ? "bg-warning/20 text-warning border-warning/30"
                                  : exam.type === "PE"
                                  ? "bg-chart-5/20 text-chart-5 border-chart-5/30"
                                  : "bg-chart-2/20 text-chart-2 border-chart-2/30"
                              }`}
                              variant="outline"
                            >
                              {exam.type}
                            </Badge>
                            {isPast && (
                              <Badge variant="secondary" className="text-[10px]">
                                Da qua
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{subject?.name}</p>
                          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {exam.startTime} - {exam.endTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {exam.room}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="rooms" className="mt-4">
          {subjects.length === 0 ? (
            <Card className="bg-card border-border">
              <CardContent className="py-12 text-center">
                <p className="text-sm text-muted-foreground">Chưa có môn học</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((subject) => {
                const subjectSlots = timetable.filter((s) => s.subjectId === subject.id)
                const rooms = [...new Set(subjectSlots.map((s) => s.room))]
                return (
                  <Card key={subject.id} className="bg-card border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                          style={{
                            backgroundColor: `${subject.color}20`,
                            color: subject.color,
                          }}
                        >
                          {subject.code.slice(0, 3)}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{subject.code}</h3>
                          <p className="text-xs text-muted-foreground mb-2">{subject.name}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {rooms.map((room) => (
                              <Badge
                                key={room}
                                variant="outline"
                                className="text-[10px] border-border text-muted-foreground"
                              >
                                <MapPin className="h-2.5 w-2.5 mr-0.5" />
                                {room}
                              </Badge>
                            ))}
                          </div>
                          {subjectSlots.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              {subjectSlots.map((slot) => (
                                <span key={slot.id} className="text-[10px] text-muted-foreground">
                                  {DAYS_OF_WEEK[slot.day]} {slot.startTime}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
