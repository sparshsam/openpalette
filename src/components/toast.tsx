"use client";

import { useEffect, useState } from "react";

export function showToast(msg: string) {
  window.dispatchEvent(new CustomEvent("op-toast", { detail: { msg } }));
}

export function Toast() {
  const [msg, setMsg] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (e as CustomEvent).detail;
      setMsg(d.msg);
      setVisible(true);
      setTimeout(() => setVisible(false), 1800);
    };
    window.addEventListener("op-toast", handler);
    return () => window.removeEventListener("op-toast", handler);
  }, []);

  if (!visible || !msg) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] rounded-full bg-[var(--text-primary)] text-[var(--bg-base)] px-5 py-2.5 text-sm font-semibold shadow-lg transition-all duration-300 animate-in fade-in">
      {msg}
    </div>
  );
}
