import swaggerUi from "swagger-ui-express";

import type { Express, Response } from "express";
import type { JsonObject } from "swagger-ui-express";

type RegisterDocsOptions = {
  openapi: JsonObject;
  cacheSlowChangingResponse: (res: Response) => void;
  exposeUi: boolean;
};

export function registerDocs(app: Express, opts: RegisterDocsOptions): void {
  // Serve OpenAPI spec as JSON
  app.get("/openapi.json", (_req, res) => {
    opts.cacheSlowChangingResponse(res);
    res.json(opts.openapi);
  });

  if (opts.exposeUi) {
    app.use("/docs", swaggerUi.serve, swaggerUi.setup(opts.openapi));
  }
}
