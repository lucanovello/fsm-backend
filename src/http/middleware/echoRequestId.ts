import type { NextFunction, Request, RequestHandler, Response } from "express";

// Echo the id to clients so they can reference it in bug reports, etc.
export const echoRequestId: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  // pino-http attaches `req.id` as string | number
  const id = (req as unknown as { id?: string | number }).id;
  if (id != null) res.setHeader("x-request-id", String(id));
  next();
};
