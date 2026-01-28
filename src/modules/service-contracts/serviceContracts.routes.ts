import { Router } from "express";

import { validateRequest } from "../../http/middleware/validate.js";

import {
  ServiceContractCreateSchema,
  ServiceContractIdParamsSchema,
  ServiceContractMaterializeSchema,
  ServiceContractsListQuerySchema,
  ServiceContractUpdateSchema,
} from "./dto/serviceContracts.dto.js";
import {
  createServiceContractHandler,
  deleteServiceContractHandler,
  getServiceContractHandler,
  listServiceContractsHandler,
  materializeServiceContractHandler,
  updateServiceContractHandler,
} from "./serviceContracts.controller.js";

export const serviceContractsRoutes = Router();

serviceContractsRoutes.get(
  "/",
  validateRequest({ query: ServiceContractsListQuerySchema }),
  listServiceContractsHandler,
);

serviceContractsRoutes.post(
  "/",
  validateRequest({ body: ServiceContractCreateSchema }),
  createServiceContractHandler,
);

serviceContractsRoutes.get(
  "/:id",
  validateRequest({ params: ServiceContractIdParamsSchema }),
  getServiceContractHandler,
);

serviceContractsRoutes.patch(
  "/:id",
  validateRequest({ params: ServiceContractIdParamsSchema, body: ServiceContractUpdateSchema }),
  updateServiceContractHandler,
);

serviceContractsRoutes.delete(
  "/:id",
  validateRequest({ params: ServiceContractIdParamsSchema }),
  deleteServiceContractHandler,
);

serviceContractsRoutes.post(
  "/:id/materialize",
  validateRequest({
    params: ServiceContractIdParamsSchema,
    body: ServiceContractMaterializeSchema,
  }),
  materializeServiceContractHandler,
);
