// scripts/test/setup-test-db.mjs
import "dotenv/config";
import { execSync } from "node:child_process";
import process from "node:process";

const log = (msg) => console.log(`[test-db] ${msg}`);

if (process.env.TEST_ENV_FILE) {
}

log(`Using DATABASE_URL=${process.env.DATABASE_URL ?? "(not set)"}`);

try {
  log("Preparing test database using Prisma migrate reset...");

  execSync("npx prisma migrate reset --force", {
    stdio: "inherit",
  });

  log("Test database is ready.");
} catch (err) {
  log("Failed to prepare test database.");
  console.error(err);
  process.exit(1);
}
