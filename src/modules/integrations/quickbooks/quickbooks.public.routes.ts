import { Router } from "express";

import { validateRequest } from "../../../http/middleware/validate.js";

import { QuickBooksCallbackQuerySchema } from "./dto/quickbooks.dto.js";
import { quickBooksCallbackHandler } from "./quickbooks.controller.js";

export const quickBooksPublicRoutes = Router();

quickBooksPublicRoutes.get(
  "/callback",
  validateRequest({ query: QuickBooksCallbackQuerySchema }),
  quickBooksCallbackHandler,
);
