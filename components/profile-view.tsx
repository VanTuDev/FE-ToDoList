"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  User,
  Plus,
  Trash2,
  GraduationCap,
  BookOpen,
  Clock,
  MapPin,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { TimetableSlot } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/constants"

const COLORS = [
  "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4",
  "#eab308", "#ef4444", "#3b82f6", "#84cc16", "#f472b6",
]

export function ProfileView() {
  const { state, updateProfile, addSubject, deleteSubject, addTimetableSlot, deleteTimetableSlot } = useApp()
  const { profile, subjects, timetable } = state

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false)

  // Local profile form state để không gọi API liên tục
  const [formProfile, setFormProfile] = useState(profile)
  const [savingProfile, setSavingProfile] = useState(false)

  // Đồng bộ lại khi profile từ server đổi (lần đầu load hoặc refresh)
  useEffect(() => {
    setFormProfile(profile)
  }, [profile])

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await updateProfile(formProfile)
      toast.success("Đã lưu thông tin cá nhân")
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không lưu được thông tin cá nhân"
      toast.error(msg)
    } finally {
      setSavingProfile(false)
    }
  }

  // New subject form
  const [newSubject, setNewSubject] = useState({
    code: "",
    name: "",
    instructor: "",
    room: "",
    credits: 3,
  })

  // New timetable form
  const [newSlot, setNewSlot] = useState({
    subjectId: "",
    day: 0,
    startTime: "07:30",
    endTime: "09:30",
    room: "",
    type: "lecture" as "lecture" | "lab" | "tutorial",
  })

  const handleAddSubject = async () => {
    if (!newSubject.code || !newSubject.name) return
    try {
      await addSubject({
        code: newSubject.code.toUpperCase(),
        name: newSubject.name,
        credits: newSubject.credits,
        instructor: newSubject.instructor,
        room: newSubject.room,
        color: COLORS[subjects.length % COLORS.length],
      })
      setNewSubject({ code: "", name: "", instructor: "", room: "", credits: 3 })
      setSubjectDialogOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thêm được môn học"
      toast.error(msg)
    }
  }

  const handleAddTimetableSlot = async () => {
    if (!newSlot.subjectId || !newSlot.room) return
    try {
      await addTimetableSlot({
        subjectId: newSlot.subjectId,
        day: newSlot.day,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        room: newSlot.room,
        type: newSlot.type,
      })
      setNewSlot({
        subjectId: "",
        day: 0,
        startTime: "07:30",
        endTime: "09:30",
        room: "",
        type: "lecture",
      })
      setTimetableDialogOpen(false)
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Không thêm được tiết TKB"
      toast.error(msg)
    }
  }

  const getSubject = (id: string) => subjects.find((s) => s.id === id)

  return (
    <div className="flex flex-col gap-4 lg:gap-6">
      {/* Profile Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <User className="h-4 w-4 text-primary" />
            Thong tin ca nhan
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={savingProfile}
          >
            {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name" className="text-xs text-muted-foreground">
                Họ và tên *
              </Label>
              <Input
                id="name"
                placeholder="Nguyen Van A"
                value={formProfile.name}
                onChange={(e) => setFormProfile((prev) => ({ ...prev, name: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="class" className="text-xs text-muted-foreground">
                Lop *
              </Label>
              <Input
                id="class"
                placeholder="SE18B02"
                value={formProfile.class}
                onChange={(e) => setFormProfile((prev) => ({ ...prev, class: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="age" className="text-xs text-muted-foreground">
                Tuổi *
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="20"
                value={formProfile.age || ""}
                onChange={(e) =>
                  setFormProfile((prev) => ({
                    ...prev,
                    age: Number.isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value),
                  }))
                }
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="studentId" className="text-xs text-muted-foreground">
                Ma sinh vien
              </Label>
              <Input
                id="studentId"
                placeholder="SE171234"
                value={formProfile.studentId}
                onChange={(e) => setFormProfile((prev) => ({ ...prev, studentId: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email" className="text-xs text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="email@fpt.edu.vn"
                value={formProfile.email}
                onChange={(e) => setFormProfile((prev) => ({ ...prev, email: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="major" className="text-xs text-muted-foreground">
                Ngành học
              </Label>
              <Input
                id="major"
                placeholder="Software Engineering"
                value={formProfile.major}
                onChange={(e) => setFormProfile((prev) => ({ ...prev, major: e.target.value }))}
                className="bg-secondary border-border"
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-4">
            {profile.name && (
              <Badge variant="secondary" className="gap-1">
                <GraduationCap className="h-3 w-3" />
                {profile.name}
              </Badge>
            )}
            {profile.class && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                {profile.class}
              </Badge>
            )}
            {profile.age > 0 && (
              <Badge variant="outline" className="border-border text-muted-foreground">
                {profile.age} tuoi
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Subjects */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <BookOpen className="h-4 w-4 text-primary" />
            Môn học ({subjects.length})
          </CardTitle>
          <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-3.5 w-3.5" />
                Thêm môn
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Thêm môn học mới</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Mã môn *</Label>
                  <Input
                    placeholder="VD: SWP391"
                    value={newSubject.code}
                    onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tên môn học *</Label>
                  <Input
                    placeholder="VD: Software Development Project"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Giang vien</Label>
                    <Input
                      placeholder="Ten giang vien"
                      value={newSubject.instructor}
                      onChange={(e) => setNewSubject({ ...newSubject, instructor: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Phòng học</Label>
                    <Input
                      placeholder="VD: DE-C301"
                      value={newSubject.room}
                      onChange={(e) => setNewSubject({ ...newSubject, room: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">So tin chi</Label>
                  <Input
                    type="number"
                    value={newSubject.credits}
                    onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })}
                    className="bg-secondary border-border"
                  />
                </div>
                <Button onClick={handleAddSubject} disabled={!newSubject.code || !newSubject.name}>
                  Thêm môn hoc
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chưa có môn học nào. Bấm "Thêm môn" để bắt đầu.
            </p>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      backgroundColor: `${subject.color}20`,
                      color: subject.color,
                    }}
                  >
                    {subject.code.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{subject.code}</p>
                    <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                    {subject.instructor && (
                      <p className="text-[10px] text-muted-foreground truncate">GV: {subject.instructor}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                    onClick={() => deleteSubject(subject.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Timetable */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Clock className="h-4 w-4 text-primary" />
            Thời khóa biểu ({timetable.length} tiết)
          </CardTitle>
          <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1" disabled={subjects.length === 0}>
                <Plus className="h-3.5 w-3.5" />
                Them lich
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Thêm lịch học mới</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Mon hoc *</Label>
                  <Select
                    value={newSlot.subjectId}
                    onValueChange={(v) => setNewSlot({ ...newSlot, subjectId: v })}
                  >
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Chon mon hoc" />
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Ngay trong tuan *</Label>
                    <Select
                      value={newSlot.day.toString()}
                      onValueChange={(v) => setNewSlot({ ...newSlot, day: parseInt(v) })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {day} (Thu {i + 2 > 7 ? "CN" : i + 2})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Loại</Label>
                    <Select
                      value={newSlot.type}
                      onValueChange={(v) => setNewSlot({ ...newSlot, type: v as "lecture" | "lab" | "tutorial" })}
                    >
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Ly thuyet</SelectItem>
                        <SelectItem value="lab">Thuc hanh</SelectItem>
                        <SelectItem value="tutorial">Bai tap</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Gio bat dau</Label>
                    <Input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Gio ket thuc</Label>
                    <Input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="bg-secondary border-border"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Phòng học *</Label>
                  <Input
                    placeholder="VD: DE-C301"
                    value={newSlot.room}
                    onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                    className="bg-secondary border-border"
                  />
                </div>
                <Button onClick={handleAddTimetableSlot} disabled={!newSlot.subjectId || !newSlot.room}>
                  Thêm lịch học
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">
              Chua co thoi khoa bieu. Thêm môn học trước, sau do bam "Them lich".
            </p>
          ) : (
            <div className="grid gap-2">
              {DAYS_OF_WEEK.slice(0, 6).map((day, dayIndex) => {
                const daySlots = timetable
                  .filter((s) => s.day === dayIndex)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                
                if (daySlots.length === 0) return null
                
                return (
                  <div key={dayIndex}>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{day}</p>
                    <div className="flex flex-col gap-2">
                      {daySlots.map((slot) => {
                        const subject = getSubject(slot.subjectId)
                        return (
                          <div
                            key={slot.id}
                            className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/50"
                          >
                            <div
                              className="w-1 h-8 rounded-full shrink-0"
                              style={{ backgroundColor: subject?.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">{subject?.code}</span>
                                <Badge variant="outline" className="text-[9px] border-border text-muted-foreground uppercase">
                                  {slot.type}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <Clock className="h-2.5 w-2.5" />
                                  {slot.startTime} - {slot.endTime}
                                </span>
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="h-2.5 w-2.5" />
                                  {slot.room}
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive shrink-0"
                              onClick={() => deleteTimetableSlot(slot.id)}
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
