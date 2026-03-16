/**
 * Gọi Gemini để trả lời chat. Dùng NEXT_PUBLIC_GEMINI_API_KEY trong .env.
 */
import { GoogleGenAI } from "@google/genai"

const MODEL = "gemini-3-flash-preview"
const QUOTA_RETRY_DELAY_MS = 32_000
const MAX_QUOTA_RETRIES = 2

function getApiKey(): string | undefined {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_GEMINI_API_KEY
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY
}

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

/**
 * Gửi tin nhắn và lấy phản hồi từ Gemini.
 * Tự retry khi gặp 429/quota (đợi ~30s rồi thử lại, tối đa 2 lần).
 */
export async function getGeminiReply(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
  userMessage: string
): Promise<string> {
  const apiKey = getApiKey()
  if (!apiKey?.trim()) {
    throw new Error("Chưa cấu hình NEXT_PUBLIC_GEMINI_API_KEY trong .env")
  }

  const parts: string[] = [
    "Bạn là trợ lý thân thiện của ứng dụng học tập. Trả lời ngắn gọn bằng tiếng Việt.",
  ]
  const recent = messages.slice(-6)
  for (const m of recent) {
    parts.push(m.role === "user" ? `User: ${m.text}` : `Assistant: ${m.text}`)
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
      const text = (response.text ?? "").trim()
      return text || "Xin lỗi, tôi không thể trả lời lúc này."
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
        throw new Error(QUOTA_MSG)
      }
      if (isServiceUnavailableError(e)) {
        throw new Error(
          "Dịch vụ Gemini đang quá tải hoặc tạm thời không khả dụng (503 Service Unavailable). Vui lòng thử lại sau ít phút."
        )
      }
      throw e
    }
  }

  throw lastError instanceof Error ? lastError : new Error(QUOTA_MSG)
}
