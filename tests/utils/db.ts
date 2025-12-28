// tests/utils/db.ts
import { prisma } from "../../src/lib/prisma";

/**
 * Raw DATABASE_URL from the environment.
 * In tests, this should come from .env.test via dotenv.
 */
const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL is not set. Check your .env.test file.");
}

/**
 * Expose the DB URL if tests need to inspect it.
 */
export const getDbUrl = (): string => dbUrl;

/**
 * Type alias for the test DB client.
 * We just reuse the app's Prisma client instead of constructing a new one.
 */
export type TestDbClient = typeof prisma;

/**
 * Historically this was an "admin" client with a different connection string.
 * For Prisma 7 + adapter, we keep the same shape but just return the shared client.
 */
export const getAdminClient = (): TestDbClient => prisma;

/**
 * Light-touch "ensure database is reachable".
 * We no longer try to override datasources or create databases here;
 * Docker / migrations are responsible for that. This just pings the DB.
 */
export const ensureDb = async (client: TestDbClient = prisma): Promise<void> => {
  // A trivial query to confirm connectivity
  await client.$executeRawUnsafe("SELECT 1;");
};

let ensured = false;

/**
 * Idempotent helper used by readiness tests.
 * Only actually runs the check once per test process.
 */
export const ensureDbReady = async (): Promise<void> => {
  if (ensured) return;
  await ensureDb();
  ensured = true;
};

/**
 * Helper used by tests that need a clean DB between runs.
 * Adjust this list if you add/remove models.
 */
export const resetDb = async (): Promise<void> => {
  await prisma.$transaction([
    prisma.loginAttempt.deleteMany(),
    prisma.passwordResetToken.deleteMany(),
    prisma.verificationToken.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);
};

/**
 * Optional: close the Prisma connection at the end of the test run.
 */
export const closeDb = async (): Promise<void> => {
  await prisma.$disconnect();
};

/**
 * Kick off a one-time DB readiness check when this module is imported
 * (similar to the old `run()` pattern, but without extra Prisma constructors).
 */
void ensureDbReady();
