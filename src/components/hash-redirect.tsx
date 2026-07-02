"use client";

import { useEffect } from "react";

/** Redirects hash-based routes (#explore, #tokens, etc.) to /studio#route */
export function HashRedirect() {
  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    // Known studio tab routes (not /studio itself, not empty)
    const studioTabs = [
      "explore", "image-picker", "contrast", "visualizer", "colors",
      "tokens", "gradient", "accessibility", "settings",
    ];
    // Also handle sub-hash patterns like /tokens/HEX, /colors/HEX, /contrast/hex1-hex2
    const subHashPattern = /^\/(colors|tokens)\/[0-9A-Fa-f]{6}$|^\/contrast\//;

    if (studioTabs.includes(hash) || subHashPattern.test(hash)) {
      window.location.replace(`/studio#${hash}`);
    }
  }, []);

  return null;
}
