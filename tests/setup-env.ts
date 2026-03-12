import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { assertSafeTestDatabaseUrl } from "../scripts/test/setup-test-db.mjs";
export { assertSafeTestDatabaseUrl };

const envPath =
  process.env.TEST_ENV_FILE ??
  process.env.TEST_ENV_PATH ??
  ".env.test";

loadEnv({ path: resolve(process.cwd(), envPath), override: true });

process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/postgres_test?schema=public";
delete process.env.RATE_LIMIT_REDIS_URL;

assertSafeTestDatabaseUrl(process.env.DATABASE_URL);

process.env.JWT_ACCESS_SECRET ??= "test_jwt_access_secret_32_chars_minimum";
process.env.JWT_REFRESH_SECRET ??= "test_jwt_refresh_secret_32_chars_minimum";
process.env.JWT_ACCESS_EXPIRY ??= "15m";
process.env.JWT_REFRESH_EXPIRY ??= "30d";







