"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api";
import { AuthView } from "@/components/auth-view";
import { ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const userId = typeof window !== "undefined" ? localStorage.getItem("unitracker_userId") : null;
    if (token && userId) {
      router.replace("/dashboard");
      return;
    }
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="flex h-dvh items-center justify-center bg-background" suppressHydrationWarning>
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Nút quay lại landing page */}
      <Link
        href="/"
        className="fixed top-4 left-4 z-50 flex items-center gap-1.5 rounded-lg border border-border bg-card/80 backdrop-blur-sm px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 hover:bg-card transition-all duration-200 shadow-sm"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Quay lại
      </Link>

      <AuthView onSuccess={() => router.replace("/dashboard")} />
    </div>
  );
}
