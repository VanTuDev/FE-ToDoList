"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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
  BookOpen,
  Clock,
  Phone,
  ShieldCheck,
  Lock,
  Save,
  GraduationCap,
  Mail,
  Hash,
  Layers,
  Calendar,
  Building2,
} from "lucide-react"
import { useApp } from "@/lib/app-context"
import { getUserInfo } from "@/lib/api"
import type { TimetableSlot } from "@/lib/types"
import { DAYS_OF_WEEK } from "@/lib/constants"
import { cn } from "@/lib/utils"

const COLORS = [
  "#f97316", "#10b981", "#8b5cf6", "#ec4899", "#06b6d4",
  "#eab308", "#ef4444", "#3b82f6", "#84cc16", "#f472b6",
]

const TYPE_LABEL: Record<string, string> = {
  lecture: "Lý thuyết",
  lab: "Thực hành",
  tutorial: "Bài tập",
}

export function ProfileView() {
  const { state, updateProfile, addSubject, deleteSubject, addTimetableSlot, deleteTimetableSlot } = useApp()
  const { profile, subjects, timetable } = state

  const [subjectDialogOpen, setSubjectDialogOpen] = useState(false)
  const [timetableDialogOpen, setTimetableDialogOpen] = useState(false)
  const [formProfile, setFormProfile] = useState(profile)
  const [savingProfile, setSavingProfile] = useState(false)

  const [accountInfo, setAccountInfo] = useState<{
    isGoogleUser: boolean
    hasPhone: boolean
    avatar: string
    name: string
    email: string
    phone: string | null
  } | null>(null)

  // Sync khi profile từ server thay đổi
  useEffect(() => { setFormProfile(profile) }, [profile])

  // Tải thông tin tài khoản, fix cứng name/email nếu là Google user
  useEffect(() => {
    getUserInfo()
      .then((info) => {
        setAccountInfo({
          isGoogleUser: info.isGoogleUser,
          hasPhone: info.hasPhone,
          avatar: info.avatar,
          name: info.name,
          email: info.email,
          phone: info.phone,
        })
        if (info.isGoogleUser) {
          setFormProfile((prev) => ({
            ...prev,
            name: info.name || prev.name,
            email: info.email || prev.email,
          }))
        }
      })
      .catch(() => {})
  }, [])

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await updateProfile(formProfile)
      toast.success("Đã lưu thông tin cá nhân")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không lưu được thông tin")
    } finally {
      setSavingProfile(false)
    }
  }

  const [newSubject, setNewSubject] = useState({ code: "", name: "", instructor: "", room: "", credits: 3 })
  const [newSlot, setNewSlot] = useState({
    subjectId: "", day: 0, startTime: "07:30", endTime: "09:30",
    room: "", type: "lecture" as "lecture" | "lab" | "tutorial",
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
      toast.success("Đã thêm môn học")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được môn học")
    }
  }

  const handleAddTimetableSlot = async () => {
    if (!newSlot.subjectId || !newSlot.room) return
    try {
      await addTimetableSlot({
        subjectId: newSlot.subjectId, day: newSlot.day,
        startTime: newSlot.startTime, endTime: newSlot.endTime,
        room: newSlot.room, type: newSlot.type,
      })
      setNewSlot({ subjectId: "", day: 0, startTime: "07:30", endTime: "09:30", room: "", type: "lecture" })
      setTimetableDialogOpen(false)
      toast.success("Đã thêm lịch học")
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Không thêm được tiết TKB")
    }
  }

  const getSubject = (id: string) => subjects.find((s) => s.id === id)
  const displayName = formProfile.name || accountInfo?.name || profile.name

  return (
    <div className="flex flex-col gap-5 lg:gap-6 pb-6">

      {/* ── Hero banner ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        {/* gradient bar */}
        <div className="absolute inset-x-0 top-0 h-28 bg-linear-to-br from-primary/20 via-primary/10 to-transparent" />
        <div className="relative px-6 pt-6 pb-5 flex flex-col sm:flex-row items-start sm:items-end gap-4">
          {/* Avatar */}
          <div className="relative shrink-0">
            {accountInfo?.avatar ? (
              <Image
                src={accountInfo.avatar}
                alt={displayName || "avatar"}
                width={72}
                height={72}
                className="rounded-2xl ring-4 ring-background shadow-lg"
                unoptimized
              />
            ) : (
              <div className="h-[72px] w-[72px] rounded-2xl bg-primary/20 ring-4 ring-background flex items-center justify-center shadow-lg">
                <User className="h-8 w-8 text-primary" />
              </div>
            )}
            {accountInfo?.isGoogleUser && (
              <span className="absolute -bottom-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 ring-2 ring-background">
                <ShieldCheck className="h-3 w-3 text-white" />
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-bold text-foreground truncate">
              {displayName || "Chưa cập nhật tên"}
            </h2>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {profile.class && (
                <Badge variant="secondary" className="text-xs gap-1">
                  <GraduationCap className="h-3 w-3" /> {profile.class}
                </Badge>
              )}
              {accountInfo?.isGoogleUser && (
                <Badge className="text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30 gap-1">
                  <ShieldCheck className="h-3 w-3" /> Google
                </Badge>
              )}
              {accountInfo?.hasPhone && (
                <Badge variant="outline" className="text-xs text-muted-foreground gap-1">
                  <Phone className="h-3 w-3" /> {accountInfo.phone}
                </Badge>
              )}
              {accountInfo?.isGoogleUser && !accountInfo.hasPhone && (
                <button
                  onClick={() => window.location.href = "/auth/setup"}
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-orange-500/50 bg-orange-500/8 px-2.5 py-0.5 text-[11px] font-medium text-orange-400 hover:bg-orange-500/15 transition-colors"
                >
                  <Plus className="h-3 w-3" /> Thêm số điện thoại
                </button>
              )}
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 sm:gap-3 shrink-0">
            <div className="text-center px-3 py-1.5 rounded-xl bg-secondary border border-border">
              <p className="text-base font-bold text-foreground">{subjects.length}</p>
              <p className="text-[10px] text-muted-foreground">Môn học</p>
            </div>
            <div className="text-center px-3 py-1.5 rounded-xl bg-secondary border border-border">
              <p className="text-base font-bold text-foreground">{timetable.length}</p>
              <p className="text-[10px] text-muted-foreground">Tiết TKB</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Thông tin cá nhân ────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-4 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <User className="h-3.5 w-3.5 text-primary" />
            </div>
            Thông tin cá nhân
          </CardTitle>
          <Button
            size="sm"
            onClick={handleSaveProfile}
            disabled={savingProfile}
            className="gap-1.5 h-8 px-3 text-xs"
          >
            <Save className="h-3.5 w-3.5" />
            {savingProfile ? "Đang lưu..." : "Lưu thông tin"}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Họ và tên */}
            <FormField
              id="name" label="Họ và tên" icon={User} required
            >
              <Input
                id="name"
                placeholder="Nguyễn Văn A"
                value={formProfile.name}
                onChange={(e) => setFormProfile((p) => ({ ...p, name: e.target.value }))}
                className="bg-secondary border-border"
              />
            </FormField>

            {/* Lớp */}
            <FormField id="class" label="Lớp học" icon={GraduationCap} required>
              <Input
                id="class"
                placeholder="SE18B02"
                value={formProfile.class}
                onChange={(e) => setFormProfile((p) => ({ ...p, class: e.target.value }))}
                className="bg-secondary border-border"
              />
            </FormField>

            {/* Tuổi */}
            <FormField id="age" label="Tuổi" icon={Hash}>
              <Input
                id="age"
                type="number"
                placeholder="20"
                min={16} max={40}
                value={formProfile.age || ""}
                onChange={(e) =>
                  setFormProfile((p) => ({
                    ...p,
                    age: Number.isNaN(parseInt(e.target.value)) ? 0 : parseInt(e.target.value),
                  }))
                }
                className="bg-secondary border-border"
              />
            </FormField>

            {/* MSSV */}
            <FormField id="studentId" label="Mã số sinh viên" icon={Hash}>
              <Input
                id="studentId"
                placeholder="SE171234"
                value={formProfile.studentId}
                onChange={(e) => setFormProfile((p) => ({ ...p, studentId: e.target.value }))}
                className="bg-secondary border-border"
              />
            </FormField>

            {/* Email */}
            <FormField
              id="email" label="Email" icon={Mail}
              locked={accountInfo?.isGoogleUser}
            >
              <Input
                id="email"
                type="email"
                placeholder="email@fpt.edu.vn"
                value={formProfile.email}
                onChange={(e) => !accountInfo?.isGoogleUser && setFormProfile((p) => ({ ...p, email: e.target.value }))}
                readOnly={accountInfo?.isGoogleUser}
                className={cn("bg-secondary border-border transition-colors",
                  accountInfo?.isGoogleUser && "text-muted-foreground cursor-default opacity-80")}
              />
            </FormField>

            {/* Ngành học */}
            <FormField id="major" label="Ngành học" icon={Layers}>
              <Input
                id="major"
                placeholder="Software Engineering"
                value={formProfile.major}
                onChange={(e) => setFormProfile((p) => ({ ...p, major: e.target.value }))}
                className="bg-secondary border-border"
              />
            </FormField>

          </div>

          {/* Preview tags */}
          {(profile.name || profile.class || profile.studentId || (profile.age ?? 0) > 0) && (
            <div className="flex flex-wrap gap-1.5 mt-4 pt-4 border-t border-border">
              {profile.name && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] text-primary">
                  <User className="h-2.5 w-2.5" />{profile.name}
                </span>
              )}
              {profile.class && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground border border-border">
                  {profile.class}
                </span>
              )}
              {profile.studentId && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground border border-border">
                  {profile.studentId}
                </span>
              )}
              {(profile.age ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-muted-foreground border border-border">
                  {profile.age} tuổi
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Môn học ─────────────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <BookOpen className="h-3.5 w-3.5 text-primary" />
            </div>
            Môn học
            <Badge variant="secondary" className="text-xs ml-0.5">{subjects.length}</Badge>
          </CardTitle>
          <Dialog open={subjectDialogOpen} onOpenChange={setSubjectDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 px-3 text-xs">
                <Plus className="h-3.5 w-3.5" /> Thêm môn
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Thêm môn học mới
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-1">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Mã môn *</Label>
                    <Input placeholder="SWP391" value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Số tín chỉ</Label>
                    <Input type="number" min={1} max={10} value={newSubject.credits}
                      onChange={(e) => setNewSubject({ ...newSubject, credits: parseInt(e.target.value) || 3 })}
                      className="bg-secondary border-border" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Tên môn học *</Label>
                  <Input placeholder="Software Development Project" value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                    className="bg-secondary border-border" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Giảng viên</Label>
                    <Input placeholder="Tên giảng viên" value={newSubject.instructor}
                      onChange={(e) => setNewSubject({ ...newSubject, instructor: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Phòng học</Label>
                    <Input placeholder="DE-C301" value={newSubject.room}
                      onChange={(e) => setNewSubject({ ...newSubject, room: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                </div>
                <Button onClick={handleAddSubject} disabled={!newSubject.code || !newSubject.name} className="mt-1">
                  <Plus className="h-4 w-4 mr-1.5" /> Thêm môn học
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {subjects.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có môn học nào</p>
              <p className="text-xs text-muted-foreground">Bấm &ldquo;Thêm môn&rdquo; để bắt đầu theo dõi.</p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {subjects.map((subject) => (
                <div
                  key={subject.id}
                  className="group flex items-center gap-3 p-3 rounded-xl bg-secondary/50 border border-transparent hover:border-border transition-colors"
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                    style={{ backgroundColor: `${subject.color}18`, color: subject.color, border: `1px solid ${subject.color}30` }}
                  >
                    {subject.code.slice(0, 3)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-semibold text-foreground truncate">{subject.code}</p>
                      <span className="text-[10px] text-muted-foreground shrink-0">{subject.credits} TC</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{subject.name}</p>
                    {subject.instructor && (
                      <p className="text-[10px] text-muted-foreground/70 truncate">GV: {subject.instructor}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => deleteSubject(subject.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Thời khóa biểu ──────────────────────────────────────────────── */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            Thời khóa biểu
            <Badge variant="secondary" className="text-xs ml-0.5">{timetable.length} tiết</Badge>
          </CardTitle>
          <Dialog open={timetableDialogOpen} onOpenChange={setTimetableDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 h-8 px-3 text-xs" disabled={subjects.length === 0}>
                <Plus className="h-3.5 w-3.5" /> Thêm lịch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-sm">
              <DialogHeader>
                <DialogTitle className="text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Thêm lịch học mới
                </DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-3 pt-1">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Môn học *</Label>
                  <Select value={newSlot.subjectId} onValueChange={(v) => setNewSlot({ ...newSlot, subjectId: v })}>
                    <SelectTrigger className="bg-secondary border-border">
                      <SelectValue placeholder="Chọn môn học" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            {s.code} – {s.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Ngày trong tuần *</Label>
                    <Select value={newSlot.day.toString()} onValueChange={(v) => setNewSlot({ ...newSlot, day: parseInt(v) })}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day, i) => (
                          <SelectItem key={i} value={i.toString()}>
                            {day} (T{i + 2 > 7 ? "CN" : i + 2})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Loại</Label>
                    <Select value={newSlot.type} onValueChange={(v) => setNewSlot({ ...newSlot, type: v as typeof newSlot.type })}>
                      <SelectTrigger className="bg-secondary border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="lecture">Lý thuyết</SelectItem>
                        <SelectItem value="lab">Thực hành</SelectItem>
                        <SelectItem value="tutorial">Bài tập</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Giờ bắt đầu</Label>
                    <Input type="time" value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-xs text-muted-foreground">Giờ kết thúc</Label>
                    <Input type="time" value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="bg-secondary border-border" />
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-xs text-muted-foreground">Phòng học *</Label>
                  <Input placeholder="VD: DE-C301" value={newSlot.room}
                    onChange={(e) => setNewSlot({ ...newSlot, room: e.target.value })}
                    className="bg-secondary border-border" />
                </div>
                <Button onClick={handleAddTimetableSlot} disabled={!newSlot.subjectId || !newSlot.room} className="mt-1">
                  <Plus className="h-4 w-4 mr-1.5" /> Thêm lịch học
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {timetable.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <div className="h-12 w-12 rounded-xl bg-secondary flex items-center justify-center">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Chưa có thời khóa biểu</p>
              <p className="text-xs text-muted-foreground">Thêm môn học trước, sau đó bấm &ldquo;Thêm lịch&rdquo;.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {DAYS_OF_WEEK.slice(0, 6).map((day, dayIndex) => {
                const daySlots = timetable
                  .filter((s) => s.day === dayIndex)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime))
                if (daySlots.length === 0) return null
                return (
                  <div key={dayIndex}>
                    {/* Day header */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {day}
                      </span>
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-muted-foreground/60">{daySlots.length} tiết</span>
                    </div>
                    {/* Slots */}
                    <div className="flex flex-col gap-2">
                      {daySlots.map((slot) => {
                        const subject = getSubject(slot.subjectId)
                        return (
                          <SlotRow
                            key={slot.id}
                            slot={slot}
                            subject={subject}
                            onDelete={() => deleteTimetableSlot(slot.id)}
                          />
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

// ─── FormField helper ─────────────────────────────────────────────────────────
function FormField({
  id, label, icon: Icon, required, locked, children,
}: {
  id: string
  label: string
  icon: React.ElementType
  required?: boolean
  locked?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
        {required && <span className="text-primary/70">*</span>}
        {locked && (
          <span className="ml-auto flex items-center gap-0.5 rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">
            <Lock className="h-2.5 w-2.5" /> Google
          </span>
        )}
      </Label>
      {children}
    </div>
  )
}

// ─── SlotRow helper ───────────────────────────────────────────────────────────
function SlotRow({
  slot, subject, onDelete,
}: {
  slot: TimetableSlot
  subject: { code: string; color: string } | undefined
  onDelete: () => void
}) {
  return (
    <div className="group flex items-center gap-3 rounded-xl bg-secondary/40 border border-transparent hover:border-border px-3 py-2.5 transition-colors">
      {/* Color bar */}
      <div className="w-1 h-9 rounded-full shrink-0" style={{ backgroundColor: subject?.color ?? "#666" }} />
      {/* Subject code */}
      <div
        className="hidden sm:flex h-9 w-14 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
        style={{ backgroundColor: `${subject?.color ?? "#666"}18`, color: subject?.color ?? "#666" }}
      >
        {subject?.code?.slice(0, 4) ?? "???"}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-foreground sm:hidden">{subject?.code ?? "—"}</span>
          <Badge variant="outline" className="text-[9px] border-border text-muted-foreground uppercase tracking-wide px-1.5 py-0">
            {TYPE_LABEL[slot.type] ?? slot.type}
          </Badge>
        </div>
        <div className="flex items-center gap-3 mt-0.5 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Clock className="h-2.5 w-2.5" />
            {slot.startTime} – {slot.endTime}
          </span>
          <span className="flex items-center gap-0.5">
            <Building2 className="h-2.5 w-2.5" />
            {slot.room}
          </span>
        </div>
      </div>
      {/* Delete */}
      <Button
        variant="ghost" size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 opacity-0 group-hover:opacity-100 transition-all"
        onClick={onDelete}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}
