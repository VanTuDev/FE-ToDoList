"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { getStoredToken } from "@/lib/api"
import { getDefaultAppPath } from "@/lib/nav-config"
import { cn } from "@/lib/utils"
import {
  GraduationCap,
  CalendarDays,
  ListTodo,
  Users,
  MessageSquare,
  Zap,
  Shield,
  Globe,
  ArrowRight,
  ChevronRight,
  Star,
  BookOpen,
  Clock,
  TrendingUp,
  Code2,
  Smartphone,
  CheckCircle2,
  Menu,
  X,
  Sparkles,
} from "lucide-react"

// ─── Typewriter hook ─────────────────────────────────────────────────────────
function useTypewriter(words: string[], speed = 80, pause = 1800) {
  const [display, setDisplay] = useState("")
  const [wordIdx, setWordIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const current = words[wordIdx]
    const timeout = setTimeout(
      () => {
        if (!deleting) {
          setDisplay(current.slice(0, charIdx + 1))
          if (charIdx + 1 === current.length) {
            setTimeout(() => setDeleting(true), pause)
          } else {
            setCharIdx((c) => c + 1)
          }
        } else {
          setDisplay(current.slice(0, charIdx - 1))
          if (charIdx - 1 === 0) {
            setDeleting(false)
            setWordIdx((w) => (w + 1) % words.length)
            setCharIdx(0)
          } else {
            setCharIdx((c) => c - 1)
          }
        }
      },
      deleting ? speed / 2 : speed
    )
    return () => clearTimeout(timeout)
  }, [charIdx, deleting, wordIdx, words, speed, pause])

  return display
}

// ─── Counter animation ────────────────────────────────────────────────────────
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        let start = 0
        const step = Math.ceil(target / 60)
        const timer = setInterval(() => {
          start += step
          if (start >= target) { setCount(target); clearInterval(timer) }
          else setCount(start)
        }, 24)
      }
    })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ─── Feature Card ─────────────────────────────────────────────────────────────
function FeatureCard({ icon: Icon, title, desc, delay = 0 }: {
  icon: React.ElementType; title: string; desc: string; delay?: number
}) {
  return (
    <div
      className="landing-card group relative flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/3 p-6 cursor-default"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Glow on hover */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at 50% 0%, rgba(249,115,22,0.08) 0%, transparent 70%)" }}
      />
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-500/10 ring-1 ring-orange-500/20 group-hover:bg-orange-500/20 group-hover:ring-orange-500/40 transition-all duration-300">
        <Icon className="h-5 w-5 text-orange-400 group-hover:text-orange-300 transition-colors" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white mb-1.5 group-hover:text-orange-100 transition-colors">{title}</h3>
        <p className="text-xs text-white/50 leading-relaxed group-hover:text-white/70 transition-colors">{desc}</p>
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LandingPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const headline = useTypewriter(
    ["Theo dõi học tập", "Quản lý thời gian", "Kết nối bạn bè", "Đạt mục tiêu"],
    75, 2000
  )

  useEffect(() => {
    setMounted(true)
    const token = getStoredToken()
    const userId = localStorage.getItem("unitracker_userId")
    setIsLoggedIn(!!(token && userId))
  }, [])

  // Nút CTA: chưa login → /login | đã login → /dashboard
  const handleCTA = () => {
    router.push(isLoggedIn ? "/dashboard" : "/login")
  }

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])

  if (!mounted) return (
    <div className="flex h-dvh items-center justify-center bg-[#080808]">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
    </div>
  )

  const features = [
    { icon: CalendarDays,  title: "Thời khóa biểu thông minh", desc: "Quản lý lịch học trực quan, nhắc nhở tự động, không bỏ lỡ buổi học nào." },
    { icon: ListTodo,      title: "Quản lý việc cần làm", desc: "Tạo task, đặt ưu tiên, theo dõi tiến độ hoàn thành từng ngày." },
    { icon: Users,         title: "Cộng đồng FPT", desc: "Kết nối với hàng nghìn sinh viên FPT, chia sẻ tài liệu, hỏi đáp, kết bạn." },
    { icon: MessageSquare, title: "Nhắn tin riêng tư", desc: "Chat 1-1 với bạn bè, chỉ mở khi cần – tiết kiệm tài nguyên server." },
    { icon: Shield,        title: "Bảo mật dữ liệu", desc: "Dữ liệu cá nhân được mã hóa, JWT authentication, riêng tư hoàn toàn." },
    { icon: Smartphone,    title: "Tối ưu mọi thiết bị", desc: "Giao diện responsive đẹp trên điện thoại, tablet lẫn desktop." },
    { icon: Zap,           title: "Hiệu suất cao", desc: "Tải trang nhanh, real-time update, trải nghiệm mượt mà nhất có thể." },
    { icon: BookOpen,      title: "Quản lý môn học", desc: "Thêm môn học, giảng viên, phòng học – tất cả trong một nơi." },
    { icon: Code2,         title: "Mã nguồn mở", desc: "Xây dựng bởi sinh viên FPT, cho sinh viên FPT. Cùng nhau phát triển!" },
  ]

  const stats = [
    { value: 1200, suffix: "+", label: "Sinh viên đăng ký" },
    { value: 8500, suffix: "+", label: "Bài viết cộng đồng" },
    { value: 99,   suffix: "%", label: "Thời gian uptime" },
    { value: 4,    suffix: " CLB", label: "FPT hỗ trợ" },
  ]

  const testimonials = [
    { name: "Nguyễn Văn An", class: "SE18B02", text: "App giúp mình không bao giờ quên lịch học nữa. Giao diện đẹp, dùng rất mượt!", avatar: "NA" },
    { name: "Trần Thị Bình", class: "AI17A01", text: "Tính năng cộng đồng hay lắm, kết bạn và trao đổi tài liệu với nhau cực tiện.", avatar: "TB" },
    { name: "Lê Minh Châu",  class: "IB20C03", text: "Đăng nhập Google phát là xong, không cần nhớ mật khẩu phức tạp.", avatar: "LC" },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden">

      {/* ── Animated grid background ── */}
      <div className="pointer-events-none fixed inset-0 z-0 animate-grid-fade"
        style={{
          backgroundImage: "linear-gradient(rgba(249,115,22,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(249,115,22,0.06) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Radial glow center */}
      <div className="pointer-events-none fixed inset-0 z-0"
        style={{ background: "radial-gradient(ellipse 80% 60% at 50% -20%, rgba(249,115,22,0.12) 0%, transparent 70%)" }}
      />

      {/* ══════════ NAVBAR ══════════ */}
      <header className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-[#080808]/90 backdrop-blur-md border-b border-white/8 shadow-lg shadow-black/30"
          : "bg-transparent"
      )}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500">
                <GraduationCap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-sm font-bold tracking-tight">
                FPT <span className="text-orange-400">UniTracker</span>
              </span>
            </div>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-6 text-sm text-white/60">
              <a href="#features" className="hover:text-orange-400 transition-colors">Tính năng</a>
              <a href="#community" className="hover:text-orange-400 transition-colors">Cộng đồng</a>
              <a href="#stats" className="hover:text-orange-400 transition-colors">Số liệu</a>
            </nav>

            {/* Navbar không có nút CTA – dùng nút lớn trong hero */}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 rounded-lg hover:bg-white/8 text-white/60"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/8 bg-[#080808]/95 backdrop-blur-xl px-4 py-4 flex flex-col gap-1 animate-slide-up">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-sm text-white/70 hover:text-orange-400 transition-colors">Tính năng</a>
            <a href="#community" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-sm text-white/70 hover:text-orange-400 transition-colors">Cộng đồng</a>
            <a href="#stats" onClick={() => setMobileMenuOpen(false)} className="py-2.5 text-sm text-white/70 hover:text-orange-400 transition-colors">Số liệu</a>
          </div>
        )}
      </header>

      {/* ══════════ HERO ══════════ */}
      <section className="relative z-10 pt-28 pb-20 px-4 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs font-medium text-orange-400 mb-8 animate-fade-in">
          <Sparkles className="h-3 w-3" />
          Dành riêng cho sinh viên FPT University
          <ChevronRight className="h-3 w-3 opacity-60" />
        </div>

        {/* Headline */}
        <h1 className="mx-auto max-w-4xl text-4xl sm:text-5xl md:text-7xl font-extrabold leading-[1.1] tracking-tight mb-4 animate-slide-up">
          <span className="text-white">Công cụ để</span>
          <br />
          <span className="shimmer-text">
            {headline}
            <span className="animate-blink ml-0.5 text-orange-400">|</span>
          </span>
        </h1>

        <p className="mx-auto max-w-xl text-base sm:text-lg text-white/50 mb-10 animate-slide-up" style={{ animationDelay: "100ms" }}>
          Nền tảng quản lý học tập toàn diện – thời khóa biểu, công việc, kết nối cộng đồng sinh viên FPT trong một ứng dụng duy nhất.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-slide-up" style={{ animationDelay: "200ms" }}>
            <button
              onClick={handleCTA}
              className="group relative flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 transition-all duration-300 px-8 py-4 text-base font-bold text-white shadow-2xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105"
            >
              <Zap className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              {isLoggedIn ? "Vào ứng dụng ngay" : "Trải nghiệm ngay"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          <a href="#features"
            className="flex items-center gap-2 rounded-xl border border-white/12 hover:border-orange-500/40 bg-white/4 hover:bg-orange-500/8 transition-all duration-300 px-7 py-3.5 text-sm font-semibold text-white/80 hover:text-white">
            <BookOpen className="h-4 w-4" />
            Xem tính năng
          </a>
        </div>

        {/* Floating badges */}
        <div className="relative mt-16 mx-auto max-w-3xl h-20 hidden sm:block">
          {[
            { text: "📅 Lịch học hôm nay: 3 tiết", x: "5%",  delay: "0s"   },
            { text: "✅ Hoàn thành 8/10 tasks",     x: "30%", delay: "1.2s" },
            { text: "👥 128 bạn bè online",          x: "62%", delay: "2.4s" },
            { text: "⚡ GPA: 3.8 / 4.0",            x: "82%", delay: "0.6s" },
          ].map((badge) => (
            <div
              key={badge.text}
              className="absolute animate-float glass rounded-full px-3.5 py-1.5 text-[11px] font-medium text-white/80 whitespace-nowrap"
              style={{ left: badge.x, top: 0, animationDelay: badge.delay }}
            >
              {badge.text}
            </div>
          ))}
        </div>

        {/* App preview mockup */}
        <div className="relative mx-auto mt-4 max-w-2xl animate-float-slow" style={{ animationDelay: "1s" }}>
          <div className="relative rounded-2xl border border-white/10 bg-[#111]/80 backdrop-blur-sm p-4 shadow-2xl shadow-black/60">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 mb-3">
              <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <div className="ml-3 flex-1 rounded-md bg-white/6 h-5 flex items-center px-2">
                <span className="text-[10px] text-white/30">https://fpt-unitracker.vercel.app</span>
              </div>
            </div>
            {/* Mock content */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Tổng quan", color: "orange" },
                { label: "Lịch học", color: "blue" },
                { label: "Cộng đồng", color: "green" },
              ].map((c) => (
                <div key={c.label} className="rounded-lg bg-white/4 p-3 border border-white/6">
                  <div className={`h-2 w-8 rounded-full mb-2 ${c.color === "orange" ? "bg-orange-500/60" : c.color === "blue" ? "bg-blue-500/60" : "bg-green-500/60"}`} />
                  <div className="h-1.5 w-full rounded-full bg-white/10 mb-1.5" />
                  <div className="h-1.5 w-4/5 rounded-full bg-white/8" />
                </div>
              ))}
            </div>
            {/* Glow */}
            <div className="absolute -inset-px rounded-2xl border border-orange-500/20 pointer-events-none" />
          </div>
          {/* Outer glow */}
          <div className="absolute -inset-8 rounded-3xl opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, rgba(249,115,22,0.3) 0%, transparent 70%)" }}
          />
        </div>
      </section>

      {/* ══════════ MARQUEE (tech stack) ══════════ */}
      <section className="relative z-10 py-8 border-y border-white/6 overflow-hidden">
        <div className="flex gap-12 animate-slide-left whitespace-nowrap">
          {["Next.js 15", "NestJS", "MongoDB", "TypeScript", "Tailwind CSS", "JWT Auth", "Google OAuth", "Passport.js", "Vercel", "Render",
            "Next.js 15", "NestJS", "MongoDB", "TypeScript", "Tailwind CSS", "JWT Auth", "Google OAuth", "Passport.js", "Vercel", "Render"
          ].map((tech, i) => (
            <span key={i} className="text-xs font-medium text-white/25 uppercase tracking-widest flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-orange-500/40 inline-block" />
              {tech}
            </span>
          ))}
        </div>
      </section>

      {/* ══════════ FEATURES ══════════ */}
      <section id="features" className="relative z-10 py-24 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-14">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">Tính năng nổi bật</p>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Mọi thứ bạn cần trong{" "}
              <span className="text-orange-400">một nơi</span>
            </h2>
            <p className="mt-3 text-sm text-white/45 max-w-md mx-auto">
              Từ lịch học đến cộng đồng, FPT UniTracker lo hết.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <FeatureCard key={f.title} {...f} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ COMMUNITY ══════════ */}
      <section id="community" className="relative z-10 py-24 px-4 overflow-hidden">
        {/* BG blob */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl opacity-10"
          style={{ background: "radial-gradient(circle, #f97316, transparent)" }} />

        <div className="mx-auto max-w-7xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-4">Cộng đồng CLB</p>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-5 leading-tight">
                Kết nối với{" "}
                <span className="shimmer-text">hàng nghìn</span>
                <br />sinh viên FPT
              </h2>
              <p className="text-sm text-white/50 leading-relaxed mb-8">
                Tham gia cộng đồng sôi động – đăng bài chia sẻ, like & comment, kết bạn và nhắn tin trực tiếp với bạn bè trong câu lạc bộ FPT University.
              </p>
              <ul className="flex flex-col gap-3">
                {[
                  "Bảng tin cộng đồng – đăng bài, like, bình luận",
                  "Tìm kiếm & kết bạn với sinh viên khác",
                  "Nhắn tin 1-1 khi đã là bạn bè",
                  "Chỉ tải khi cần – tiết kiệm pin & data",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-white/65">
                    <CheckCircle2 className="h-4 w-4 text-orange-400 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleCTA}
                className="inline-flex items-center gap-2 mt-8 rounded-xl bg-orange-500 hover:bg-orange-400 transition-all hover:scale-105 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/25"
              >
                {isLoggedIn ? "Vào ứng dụng" : "Tham gia ngay"} <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            {/* Community cards mockup */}
            <div className="relative space-y-3">
              {[
                { name: "Nguyễn A", time: "2 phút", text: "Ai có tài liệu môn SWP391 không? Share với mình nhé 🙏", likes: 12, comments: 5, avatar: "NA" },
                { name: "Trần B",   time: "15 phút", text: "Vừa pass interview FPT Software rồi anh em ơi! Cảm ơn cộng đồng đã hỗ trợ ❤️", likes: 47, comments: 18, avatar: "TB" },
                { name: "Lê C",     time: "1 giờ",  text: "Lịch thi HK2 2026 đã ra, mọi người check ngay nhé!", likes: 89, comments: 31, avatar: "LC" },
              ].map((post, i) => (
                <div key={i} className={cn(
                  "relative rounded-xl border border-white/8 bg-white/3 p-4 transition-all duration-300 hover:border-orange-500/30 hover:bg-orange-500/5 group",
                  i === 1 && "ml-4"
                )}>
                  <div className="flex gap-3">
                    <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400 shrink-0">
                      {post.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white">{post.name}</span>
                        <span className="text-[10px] text-white/30">{post.time} trước</span>
                      </div>
                      <p className="text-xs text-white/60 leading-relaxed">{post.text}</p>
                      <div className="flex gap-4 mt-2.5">
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <span>❤️</span> {post.likes}
                        </span>
                        <span className="text-[10px] text-white/30 flex items-center gap-1">
                          <MessageSquare className="h-2.5 w-2.5" /> {post.comments}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══════════ STATS ══════════ */}
      <section id="stats" className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-2xl border border-orange-500/20 bg-orange-500/5 p-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-2 group">
                <p className="text-3xl sm:text-4xl font-black text-orange-400 group-hover:animate-text-glow transition-all">
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-white/45">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ TESTIMONIALS ══════════ */}
      <section className="relative z-10 py-20 px-4">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-400 mb-3">Đánh giá từ sinh viên</p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Sinh viên FPT nói gì?
            </h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="landing-card rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="flex gap-1 mb-3">
                  {[1,2,3,4,5].map((s) => (
                    <Star key={s} className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
                  ))}
                </div>
                <p className="text-sm text-white/60 leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-full bg-orange-500/20 flex items-center justify-center text-xs font-bold text-orange-400">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">{t.name}</p>
                    <p className="text-[10px] text-white/35">{t.class}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════ CTA FINAL ══════════ */}
      <section className="relative z-10 py-24 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(249,115,22,0.1) 0%, transparent 70%)" }}
        />
        <div className="mx-auto max-w-2xl relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-4 py-1.5 text-xs text-orange-400 mb-6">
            <TrendingUp className="h-3 w-3" />
            Hoàn toàn miễn phí
          </div>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Sẵn sàng nâng cấp
            <br />
            <span className="shimmer-text">trải nghiệm học tập?</span>
          </h2>
          <p className="text-sm text-white/45 mb-10">
            Đăng ký ngay bằng Google hoặc số điện thoại. Không cần thẻ tín dụng.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={handleCTA}
              className="group flex items-center gap-2 rounded-xl bg-orange-500 hover:bg-orange-400 transition-all hover:scale-105 px-8 py-3.5 text-sm font-bold text-white shadow-2xl shadow-orange-500/30"
            >
              <GraduationCap className="h-4 w-4" />
              {isLoggedIn ? "Vào ứng dụng của tôi" : "Bắt đầu học tập thông minh"}
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-white/25">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /> Miễn phí</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /> Không quảng cáo</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-400" /> Bảo mật</span>
          </div>
        </div>
      </section>

      {/* ══════════ FOOTER ══════════ */}
      <footer className="relative z-10 border-t border-white/8 py-10 px-4">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-500">
              <GraduationCap className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-white/80">FPT <span className="text-orange-400">UniTracker</span></span>
          </div>
          <p className="text-xs text-white/25">
            © 2026 FPT UniTracker · Xây dựng bởi sinh viên FPT University
          </p>
          <div className="flex gap-4 text-xs text-white/30">
            <Link href="/login" className="hover:text-orange-400 transition-colors">Đăng nhập</Link>
            <a href="#features" className="hover:text-orange-400 transition-colors">Tính năng</a>
            <a href="#community" className="hover:text-orange-400 transition-colors">Cộng đồng</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
