import { Router } from "express";

import { quickBooksPublicRoutes } from "../../modules/integrations/quickbooks/quickbooks.public.routes.js";

export const integrationsPublicRoutes = Router();

integrationsPublicRoutes.use("/quickbooks", quickBooksPublicRoutes);
