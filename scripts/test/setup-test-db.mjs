// scripts/test/setup-test-db.mjs
import "dotenv/config";
import fs from "node:fs";
import { execSync } from "node:child_process";
import process from "node:process";

const log = (msg) => console.log(`[test-db] ${msg}`);

/**
 * Load .env.test if it exists and TEST_ENV_FILE not already defined.
 * This ensures DATABASE_URL points to the test DB, not dev.
 */
const testEnvFile = process.env.TEST_ENV_FILE || ".env.test";
if (fs.existsSync(testEnvFile)) {
  const dotenv = await import("dotenv");
  dotenv.config({ path: testEnvFile });
  log(`Loaded ${testEnvFile}`);
}

/**
 * Ensure DATABASE_URL points to a test database.
 * If it doesn’t, derive one by appending "_test" to the current DB name.
 */
let dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  log("❌ DATABASE_URL is not set — cannot proceed.");
  process.exit(1);
}

try {
  const url = new URL(dbUrl);
  const currentDb = url.pathname.replace(/^\//, "");
  if (!currentDb.endsWith("_test")) {
    const testDb = `${currentDb.replace(/[-]+/g, "_")}_test`;
    url.pathname = `/${testDb}`;
    dbUrl = url.toString();
    process.env.DATABASE_URL = dbUrl;
    log(`Adjusted DATABASE_URL to use test database: ${testDb}`);
  } else {
    log(`Using existing test DB name: ${currentDb}`);
  }
} catch (e) {
  log(`❌ Invalid DATABASE_URL: ${dbUrl}`);
  console.error(e);
  process.exit(1);
}

log(`Using DATABASE_URL=${process.env.DATABASE_URL}`);

try {
  log("Preparing test database using Prisma migrate reset...");
  execSync("npx prisma migrate reset --force", { stdio: "inherit" });
  log("✅ Test database is ready.");
} catch (err) {
  log("❌ Failed to prepare test database.");
  console.error(err);
  process.exit(1);
}
