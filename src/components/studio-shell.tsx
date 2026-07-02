"use client";

import { WorkspaceProvider } from "@/components/workspace-context";
import { OpenPaletteApp } from "@/components/openpalette-app";

/** Shell component that wraps the workspace app with its provider */
export function StudioShell() {
  return (
    <WorkspaceProvider>
      <OpenPaletteApp />
    </WorkspaceProvider>
  );
}
