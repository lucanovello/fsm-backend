import { execSync } from "node:child_process";
import fs from "node:fs";
import process from "node:process";
import { pathToFileURL } from "node:url";

const log = (msg) => console.log(`[test-db] ${msg}`);
const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export function assertSafeTestDatabaseUrl(databaseUrl) {
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(databaseUrl);
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`DATABASE_URL is not a valid URL. Value: ${databaseUrl}. Reason: ${reason}`);
  }

  const databaseName = parsedUrl.pathname.replace(/^\//, "");
  if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
    throw new Error(
      `DATABASE_URL host must be localhost/127.0.0.1/::1 for tests. Received: ${parsedUrl.hostname}`,
    );
  }

  if (!databaseName.toLowerCase().endsWith("_test")) {
    throw new Error(`DATABASE_URL database name must end with _test. Received: ${databaseName}`);
  }
}

function loadTestEnvFile() {
  const testEnvFile = process.env.TEST_ENV_FILE || ".env.test";
  if (!fs.existsSync(testEnvFile)) {
    throw new Error(`Test env file not found: ${testEnvFile}`);
  }

  return import("dotenv").then((dotenv) => {
    dotenv.config({ path: testEnvFile, override: true });
    log(`Loaded ${testEnvFile}`);
  });
}

export async function main() {
  await loadTestEnvFile();

  const dbUrl = process.env.DATABASE_URL;
  try {
    assertSafeTestDatabaseUrl(dbUrl);
  } catch (error) {
    log("Refusing to reset database because DATABASE_URL is unsafe.");
    console.error(error);
    process.exit(1);
  }

  log(`Using DATABASE_URL=${process.env.DATABASE_URL}`);

  try {
    log("Preparing test database using Prisma migrate reset...");
    execSync("npx prisma migrate reset --force", { stdio: "inherit" });
    log("Test database is ready.");
  } catch (err) {
    log("Failed to prepare test database.");
    console.error(err);
    process.exit(1);
  }
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(process.argv[1]).href
  : false;

if (isDirectRun) {
  await main();
}
