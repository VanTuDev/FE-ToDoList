import { NextRequest, NextResponse } from "next/server"
import { GoogleGenAI } from "@google/genai"

const MODEL = process.env.GEMINI_MODEL || "gemini-3-flash-preview"
const QUOTA_RETRY_DELAY_MS = 32_000
const MAX_QUOTA_RETRIES = 2

function isQuotaError(e: unknown): boolean {
  const s = typeof e === "string" ? e : e instanceof Error ? e.message : JSON.stringify(e)
  return (
    s.includes("429") ||
    s.includes("RESOURCE_EXHAUSTED") ||
    s.includes("Quota exceeded") ||
    s.includes("quota") ||
    s.includes("rate-limit")
  )
}

function isServiceUnavailableError(e: unknown): boolean {
  const s = typeof e === "string" ? e : e instanceof Error ? e.message : JSON.stringify(e)
  return s.includes("503") || s.toLowerCase().includes("service unavailable")
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

const QUOTA_MSG =
  "Đã hết hạn mức API Gemini (free tier). Đợi vài phút hoặc kiểm tra quota/billing tại https://ai.google.dev/gemini-api/docs/rate-limits"

type Body = {
  messages?: Array<{ role: "user" | "assistant"; text: string }>
  userMessage?: string
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY
  if (!apiKey?.trim()) {
    return NextResponse.json(
      { error: "Thiếu GEMINI_API_KEY (khuyến nghị) hoặc NEXT_PUBLIC_GEMINI_API_KEY." },
      { status: 500 }
    )
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ error: "Body không hợp lệ." }, { status: 400 })
  }

  const userMessage = String(body.userMessage ?? "").trim()
  if (!userMessage) {
    return NextResponse.json({ error: "Thiếu userMessage." }, { status: 400 })
  }

  const history = Array.isArray(body.messages) ? body.messages.slice(-6) : []
  const parts: string[] = [
    "Bạn là trợ lý thân thiện của ứng dụng học tập. Trả lời ngắn gọn bằng tiếng Việt.",
  ]
  for (const m of history) {
    if (!m || (m.role !== "user" && m.role !== "assistant")) continue
    const text = typeof m.text === "string" ? m.text : ""
    parts.push(m.role === "user" ? `User: ${text}` : `Assistant: ${text}`)
  }
  parts.push(`User: ${userMessage}`)
  parts.push("Assistant:")

  const ai = new GoogleGenAI({ apiKey })
  const contents = parts.join("\n\n")

  let lastError: unknown
  for (let attempt = 1; attempt <= MAX_QUOTA_RETRIES + 1; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
      })
      const reply = (response.text ?? "").trim()
      return NextResponse.json({ reply: reply || "Xin lỗi, tôi không thể trả lời lúc này." })
    } catch (e) {
      lastError = e
      if (
        attempt <= MAX_QUOTA_RETRIES &&
        (isQuotaError(e) || isServiceUnavailableError(e))
      ) {
        await delay(QUOTA_RETRY_DELAY_MS)
        continue
      }
      if (isQuotaError(e)) {
        return NextResponse.json({ error: QUOTA_MSG }, { status: 429 })
      }
      if (isServiceUnavailableError(e)) {
        return NextResponse.json(
          {
            error:
              "Dịch vụ Gemini đang quá tải hoặc tạm thời không khả dụng (503). Vui lòng thử lại sau ít phút.",
          },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Lỗi gọi Gemini." },
        { status: 500 }
      )
    }
  }

  return NextResponse.json(
    { error: lastError instanceof Error ? lastError.message : QUOTA_MSG },
    { status: 500 }
  )
}

