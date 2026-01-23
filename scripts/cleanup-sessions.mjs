import { spawnSync } from "node:child_process";
import process from "node:process";

const result = spawnSync("npx", ["tsx", "scripts/cleanup-sessions.ts"], {
  stdio: "inherit",
});

process.exitCode = result.status ?? 1;
