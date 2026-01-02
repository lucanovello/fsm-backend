import type { RequestHandler } from "express";
import type { ZodType } from "zod";

type Schemas = {
  body?: ZodType<any>;
  params?: ZodType<any>;
  query?: ZodType<any>;
};

/**
 * Validates request segments (body, params, query) with provided Zod schemas.
 * On success, the parsed values replace the originals, ensuring downstream handlers
 * operate on validated data. On failure, the Zod error is forwarded to the error pipeline.
 */
export function validateRequest({ body, params, query }: Schemas): RequestHandler {
  return (req, _res, next) => {
    try {
      if (body) {
        req.body = body.parse(req.body);
      }
      if (params) {
        req.params = params.parse(req.params) as typeof req.params;
      }
      if (query) {
        req.query = query.parse(req.query) as typeof req.query;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
