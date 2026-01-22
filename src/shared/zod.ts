import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

// Ensure the OpenAPI extension is applied exactly once.
// Using a global flag avoids double-patching across module reloads.
const OPENAPI_ZOD_FLAG = "__FSM_BACKEND_ZOD_OPENAPI_EXTENDED__" as const;

const globalAny = globalThis as typeof globalThis & {
  [OPENAPI_ZOD_FLAG]?: boolean;
};

if (!globalAny[OPENAPI_ZOD_FLAG]) {
  extendZodWithOpenApi(z);
  globalAny[OPENAPI_ZOD_FLAG] = true;
}

export { z };
