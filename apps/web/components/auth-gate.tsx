"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { api, ApiError, type CurrentUserInfo } from "@/lib/api";

/** Blocks the app until the session is confirmed. Unauthenticated visitors go to /login. */
export function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    api<CurrentUserInfo>("/auth/me")
      .then(() => setState("ok"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
        } else {
          // API unreachable: show the app shell with a status message instead of a blank page.
          setState("ok");
        }
      });
  }, [router]);

  if (state === "checking") {
    return <p className="muted">Memeriksa sesi...</p>;
  }
  return <>{children}</>;
}
