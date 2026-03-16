"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { getStoredToken } from "@/lib/api"
import { getDefaultAppPath } from "@/lib/nav-config"

function readAuthFromStorage(): { token: string; userId: string } | null {
  if (typeof window === "undefined") return null
  const token = getStoredToken()
  const userId = localStorage.getItem("unitracker_userId")
  return token && userId ? { token, userId } : null
}

export default function Home() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const auth = readAuthFromStorage()
    if (!auth) {
      router.replace("/login")
      return
    }
    const path = getDefaultAppPath()
    router.replace(path)
  }, [mounted, router])

  if (!mounted) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background" suppressHydrationWarning>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="flex h-dvh items-center justify-center bg-background" suppressHydrationWarning>
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  )
}
