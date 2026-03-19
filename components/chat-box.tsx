"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { MessageCircle, X, Loader2, GripHorizontal, Bot, Send } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGeminiReply } from "@/lib/chat-ai"

type Message = { id: string; role: "user" | "assistant"; text: string }

/** Giới hạn tọa độ trong viewport */
function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val))
}

export function ChatBox() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

  // ─── Draggable position (bottom-right offset trong px) ────────────────────
  const [pos, setPos] = useState({ right: 24, bottom: 24 })
  const isDragging = useRef(false)
  const dragStart = useRef({ mouseX: 0, mouseY: 0, right: 24, bottom: 24 })

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    dragStart.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      right: pos.right,
      bottom: pos.bottom,
    }
  }, [pos])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return
      const dx = e.clientX - dragStart.current.mouseX
      const dy = e.clientY - dragStart.current.mouseY
      setPos({
        right: clamp(dragStart.current.right - dx, 8, window.innerWidth - 64),
        bottom: clamp(dragStart.current.bottom - dy, 8, window.innerHeight - 64),
      })
    }
    const onUp = () => { isDragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [])

  // Touch support
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0]
    isDragging.current = true
    dragStart.current = {
      mouseX: t.clientX,
      mouseY: t.clientY,
      right: pos.right,
      bottom: pos.bottom,
    }
  }, [pos])

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (!isDragging.current) return
      const t = e.touches[0]
      const dx = t.clientX - dragStart.current.mouseX
      const dy = t.clientY - dragStart.current.mouseY
      setPos({
        right: clamp(dragStart.current.right - dx, 8, window.innerWidth - 64),
        bottom: clamp(dragStart.current.bottom - dy, 8, window.innerHeight - 64),
      })
    }
    const onTouchEnd = () => { isDragging.current = false }
    window.addEventListener("touchmove", onTouchMove, { passive: false })
    window.addEventListener("touchend", onTouchEnd)
    return () => {
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", onTouchEnd)
    }
  }, [])

  // Auto scroll xuống cuối chat
  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight
    }
  }, [open, messages, loading])

  const send = async () => {
    const text = input.trim()
    if (!text || loading) return
    const userMsg: Message = { id: `u-${Date.now()}`, role: "user", text }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)
    try {
      const history = messages.map((m) => ({ role: m.role, text: m.text }))
      const reply = await getGeminiReply(history, text)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: reply },
      ])
    } catch (e) {
      const msg =
        e instanceof Error
          ? e.message
          : "Không gửi được. Kiểm tra cấu hình GEMINI_API_KEY."
      toast.error(msg)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: `Lỗi: ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  const panelStyle: React.CSSProperties = {
    position: "fixed",
    right: `${pos.right}px`,
    bottom: `${pos.bottom + 60}px`, // panel hiện ngay trên nút
    zIndex: 50,
  }

  const btnStyle: React.CSSProperties = {
    position: "fixed",
    right: `${pos.right}px`,
    bottom: `${pos.bottom}px`,
    zIndex: 51,
  }

  return (
    <>
      {/* ── Chat panel ─────────────────────────────────────────────────── */}
      {open && (
        <div
          style={panelStyle}
          className="flex flex-col w-[340px] h-[420px] rounded-2xl border border-orange-500/30 bg-card shadow-2xl shadow-orange-500/10 overflow-hidden"
        >
          {/* Header – drag handle */}
          <div
            className="flex items-center justify-between bg-linear-to-r from-orange-500 to-amber-500 px-3 py-2 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={onMouseDown}
            onTouchStart={onTouchStart}
          >
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-white" />
              <span className="text-sm font-semibold text-white">Chat AI</span>
            </div>
            <div className="flex items-center gap-1">
              <GripHorizontal className="h-4 w-4 text-white/60" />
              <button
                className="text-white/80 hover:text-white transition-colors ml-1"
                onClick={() => setOpen(false)}
                aria-label="Đóng"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0 bg-card"
          >
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Bot className="h-6 w-6 text-orange-500" />
                </div>
                <p className="text-xs text-muted-foreground">
                  Xin chào! Tôi là trợ lý AI.<br />Hãy đặt câu hỏi để bắt đầu.
                </p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "rounded-2xl px-3 py-2 text-sm max-w-[85%] leading-relaxed",
                  m.role === "user"
                    ? "ml-auto bg-orange-500 text-white rounded-br-sm"
                    : "mr-auto bg-secondary text-foreground rounded-bl-sm"
                )}
              >
                {m.text}
              </div>
            ))}
            {loading && (
              <div className="mr-auto rounded-2xl rounded-bl-sm px-3 py-2 bg-secondary text-foreground inline-flex items-center gap-1.5 text-sm">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-orange-500" />
                Đang trả lời...
              </div>
            )}
          </div>

          {/* Input */}
          <div className="border-t border-border p-2 flex gap-2 bg-card">
            <Input
              placeholder="Nhập tin nhắn..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              className="flex-1 bg-secondary border-border text-sm"
            />
            <Button
              size="sm"
              onClick={send}
              disabled={!input.trim() || loading}
              className="bg-orange-500 hover:bg-orange-400 text-white border-0 gap-1"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* ── Floating button (cam, nổi bật, có thể kéo) ─────────────────── */}
      <button
        style={btnStyle}
        aria-label={open ? "Đóng Chat AI" : "Mở Chat AI"}
        onMouseDown={(e) => {
          // Chỉ drag khi giữ chuột > 150ms
          const t = setTimeout(() => onMouseDown(e), 150)
          const cancel = () => clearTimeout(t)
          window.addEventListener("mouseup", cancel, { once: true })
        }}
        onClick={() => !isDragging.current && setOpen((v) => !v)}
        className={cn(
          "h-14 w-14 rounded-full flex items-center justify-center",
          "bg-orange-500 hover:bg-orange-400 text-white",
          "shadow-lg shadow-orange-500/40",
          "transition-all duration-200 hover:scale-110 active:scale-95",
          "ring-4 ring-orange-500/20",
          !open && "animate-pulse-glow"
        )}
      >
        {open
          ? <X className="h-6 w-6" />
          : <Bot className="h-6 w-6" />
        }
      </button>
    </>
  )
}
