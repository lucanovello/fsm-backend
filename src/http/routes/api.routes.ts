import { Router } from "express";

import { customersRoutes } from "../../modules/customers/customers.routes.js";
import { techniciansRoutes } from "../../modules/technicians/technicians.routes.js";
import { workOrdersRoutes } from "../../modules/work-orders/workOrders.routes.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const apiRoutes = Router();

// Protect all API endpoints; adjust if some should be public.
apiRoutes.use(requireAuth);
apiRoutes.use("/customers", customersRoutes);
apiRoutes.use("/technicians", techniciansRoutes);
apiRoutes.use("/work-orders", workOrdersRoutes);
