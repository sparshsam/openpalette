"use client";
import { useEffect } from "react";
export function StripFdid() {
  useEffect(() => {
    try {
      document.querySelectorAll("[fdprocessedid]").forEach((el) => el.removeAttribute("fdprocessedid"));
    } catch {}
  }, []);
  return null;
}
