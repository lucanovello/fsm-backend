import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    pool: "forks",
    fileParallelism: false,
    include: ["tests/**/*.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 65,
      },
      exclude: [
        "dist/**",
        "coverage/**",
        "prisma/**",
        "scripts/**",
        "src/build/**",
        "src/index.ts",
        "src/generated/**",
        "src/types/**",
        "src/openapi/zod.ts",
        "tests/**",
        "vitest.config.ts",
        "*.config.*",
        "**/*.d.ts",
      ],
    },
  },
});
