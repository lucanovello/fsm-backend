import {
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../components/errors.js";
import {
  CustomerDetailResponseSchema,
  CustomerIdParamsOpenApiSchema,
  CustomersListQueryParamsSchema,
  CustomersListResponseSchema,
  TechniciansListQueryParamsSchema,
  TechniciansListResponseSchema,
  WorkOrderDetailResponseSchema,
  WorkOrderIdParamsOpenApiSchema,
  WorkOrdersListQueryParamsSchema,
  WorkOrdersListResponseSchema,
} from "../components/fsm.schemas.js";
import { Tags } from "../tags.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export function registerFsmPaths(registry: OpenAPIRegistry): void {
  registry.registerPath({
    method: "get",
    path: "/api/customers",
    summary: "List customers",
    description: "Search and paginate customers by name, email, or phone.",
    tags: [Tags.Customers],
    security: [{ BearerAuth: [] }],
    request: { query: CustomersListQueryParamsSchema },
    responses: {
      200: {
        description: "Customer list.",
        content: { "application/json": { schema: CustomersListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/customers/{id}",
    summary: "Get customer details",
    description: "Fetch a customer with locations and recent work orders.",
    tags: [Tags.Customers],
    security: [{ BearerAuth: [] }],
    request: { params: CustomerIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Customer found.",
        content: { "application/json": { schema: CustomerDetailResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Customer not found", {
        message: "Customer not found",
        code: "CUSTOMER_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/technicians",
    summary: "List technicians",
    description: "Paginated technician directory with contact info.",
    tags: [Tags.Technicians],
    security: [{ BearerAuth: [] }],
    request: { query: TechniciansListQueryParamsSchema },
    responses: {
      200: {
        description: "Technician list.",
        content: { "application/json": { schema: TechniciansListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/work-orders",
    summary: "List work orders",
    description: "Filter and paginate work orders by date, status, or technician.",
    tags: [Tags.WorkOrders],
    security: [{ BearerAuth: [] }],
    request: { query: WorkOrdersListQueryParamsSchema },
    responses: {
      200: {
        description: "Work order list.",
        content: { "application/json": { schema: WorkOrdersListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/work-orders/{id}",
    summary: "Get work order",
    description: "Detailed work order with location, notes, and line items.",
    tags: [Tags.WorkOrders],
    security: [{ BearerAuth: [] }],
    request: { params: WorkOrderIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Work order found.",
        content: { "application/json": { schema: WorkOrderDetailResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work order not found", {
        message: "Work order not found",
        code: "WORK_ORDER_NOT_FOUND",
      }),
    },
  });
}
