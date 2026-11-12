"use client";

import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      type="button"
      className="btn btn-ghost btn-sm"
      onClick={async () => {
        try {
          await api("/auth/logout", { method: "POST" });
        } finally {
          router.replace("/login");
        }
      }}
    >
      Keluar
    </button>
  );
}
