
export async function getGeminiReply(
  messages: Array<{ role: "user" | "assistant"; text: string }>,
  userMessage: string
): Promise<string> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, userMessage }),
  })

  if (!res.ok) {
    let message = `Lỗi chat (${res.status})`
    try {
      const data = await res.json()
      if (typeof data?.error === "string") message = data.error
    } catch {
      // ignore
    }
    throw new Error(message)
  }

  const data = (await res.json()) as { reply?: string }
  return (data.reply ?? "").trim() || "Xin lỗi, tôi không thể trả lời lúc này."
}
