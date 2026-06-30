import { type FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  // The webServer config in playwright.config.ts handles starting the dev server.
  // This global setup just verifies the server is reachable before tests start.
  const baseURL = config.projects[0].use.baseURL ?? "http://localhost:1997";
  try {
    const resp = await fetch(baseURL);
    if (!resp.ok) {
      throw new Error(`Dev server responded with ${resp.status}`);
    }
    console.log(`[global-setup] Server at ${baseURL} is running.`);
  } catch (err) {
    console.error(`[global-setup] Cannot reach dev server at ${baseURL}:`, err);
    process.exit(1);
  }
}

export default globalSetup;
