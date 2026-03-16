"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getStoredToken } from "@/lib/api";
import { AuthView } from "@/components/auth-view";

export default function LoginPage() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const token = getStoredToken();
    const userId = typeof window !== "undefined" ? localStorage.getItem("unitracker_userId") : null;
    if (token && userId) {
      router.replace("/");
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
    <AuthView
      onSuccess={() => {
        router.replace("/");
      }}
    />
  );
}
