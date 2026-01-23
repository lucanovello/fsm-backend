#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import process from "node:process";

const forwardedArgs = process.argv.slice(2);
const result = spawnSync(
  "npx",
  ["tsx", "scripts/users/bootstrap-first-admin.ts", ...forwardedArgs],
  { stdio: "inherit" },
);

process.exitCode = result.status ?? 1;
