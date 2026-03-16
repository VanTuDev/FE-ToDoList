"use client"

import { useRouter } from "next/navigation"
import { DashboardView } from "@/components/dashboard-view"

export default function DashboardPage() {
  const router = useRouter()
  return (
    <DashboardView
      onNavigate={(view) => router.push(`/${view}`)}
    />
  )
}
