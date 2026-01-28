import { Router } from "express";

import { quickBooksWebhookRoutes } from "../../modules/integrations/quickbooks/quickbooks.webhook.routes.js";

export const webhooksRoutes = Router();

webhooksRoutes.use("/quickbooks", quickBooksWebhookRoutes);
