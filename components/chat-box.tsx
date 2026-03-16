"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { getGeminiReply } from "@/lib/chat-ai"

type Message = { id: string; role: "user" | "assistant"; text: string }

export function ChatBox() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)

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
      const msg = e instanceof Error ? e.message : "Không gửi được. Kiểm tra NEXT_PUBLIC_GEMINI_API_KEY trong .env."
      toast.error(msg)
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", text: `Lỗi: ${msg}` },
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 right-6 z-40 flex flex-col rounded-xl border border-border bg-card shadow-lg transition-all duration-200",
          open ? "h-[420px] w-[340px]" : "h-0 w-0 overflow-hidden opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <span className="text-sm font-semibold text-foreground">Chat</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => setOpen(false)}
            aria-label="Đóng chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0"
        >
          {messages.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Gửi tin nhắn để bắt đầu...
            </p>
          )}
          {messages.map((m) => (
            <div
              key={m.id}
              className={cn(
                "rounded-lg px-3 py-2 text-sm max-w-[85%]",
                m.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-secondary text-foreground"
              )}
            >
              {m.text}
            </div>
          ))}
          {loading && (
            <div className="mr-auto rounded-lg px-3 py-2 bg-secondary text-foreground inline-flex items-center gap-1.5 text-sm">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang trả lời...
            </div>
          )}
        </div>
        <div className="border-t border-border p-2 flex gap-2">
          <Input
            placeholder="Nhập tin nhắn..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            className="flex-1 bg-secondary border-border text-sm"
          />
          <Button size="sm" onClick={send} disabled={!input.trim() || loading}>
            Gửi
          </Button>
        </div>
      </div>

      {!open && (
        <Button
          size="icon"
          className="fixed bottom-6 right-6 z-30 h-12 w-12 rounded-full shadow-lg border border-border bg-card hover:bg-primary hover:text-primary-foreground hover:border-primary"
          onClick={() => setOpen(true)}
          aria-label="Mở chat"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}
    </>
  )
}
