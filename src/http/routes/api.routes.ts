import { Router } from "express";

import { crewsRoutes } from "../../modules/crews/crews.routes.js";
import { customersRoutes } from "../../modules/customers/customers.routes.js";
import { organizationsRoutes } from "../../modules/organizations/organizations.routes.js";
import { schedulingRoutes } from "../../modules/scheduling/scheduling.routes.js";
import { serviceResourcesRoutes } from "../../modules/service-resources/serviceResources.routes.js";
import { techniciansRoutes } from "../../modules/technicians/technicians.routes.js";
import { workOrdersRoutes } from "../../modules/work-orders/workOrders.routes.js";
import { resolveOrgContext } from "../middleware/orgContext.js";
import { requireAuth } from "../middleware/requireAuth.js";

export const apiRoutes = Router();

// Protect all API endpoints; adjust if some should be public.
apiRoutes.use(requireAuth);
apiRoutes.use(resolveOrgContext());
apiRoutes.use("/organizations", organizationsRoutes);
apiRoutes.use("/customers", customersRoutes);
apiRoutes.use("/service-resources", serviceResourcesRoutes);
apiRoutes.use("/crews", crewsRoutes);
apiRoutes.use("/technicians", techniciansRoutes);
apiRoutes.use("/work-orders", workOrdersRoutes);
apiRoutes.use("/scheduling", schedulingRoutes);
