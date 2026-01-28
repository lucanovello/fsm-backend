import { Router } from "express";

import { quickBooksRoutes } from "./quickbooks/quickbooks.routes.js";

export const integrationsRoutes = Router();

integrationsRoutes.use("/quickbooks", quickBooksRoutes);
