import { Router } from "express";

import { validateRequest } from "../../../http/middleware/validate.js";

import { QuickBooksWebhookSchema } from "./dto/quickbooks.dto.js";
import { quickBooksWebhookHandler } from "./quickbooks.controller.js";

export const quickBooksWebhookRoutes = Router();

quickBooksWebhookRoutes.post(
  "/",
  validateRequest({ body: QuickBooksWebhookSchema }),
  quickBooksWebhookHandler,
);
