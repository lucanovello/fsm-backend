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
  WorkOrderIncidentCreateRequestSchema,
  WorkOrderIncidentParamsOpenApiSchema,
  WorkOrderIncidentResponseSchema,
  WorkOrderTaskInstantiateRequestSchema,
  WorkOrderTaskParamsOpenApiSchema,
  WorkOrderTaskStatusUpdateRequestSchema,
  WorkOrderTaskStatusUpdateResponseSchema,
  WorkOrderTasksResponseSchema,
  WorkTemplateCreateRequestSchema,
  WorkTemplateIdParamsOpenApiSchema,
  WorkTemplateResponseSchema,
  WorkTemplateUpdateRequestSchema,
  WorkTemplatesListQueryParamsSchema,
  WorkTemplatesListResponseSchema,
  WorkOrderDetailResponseSchema,
  WorkOrderIdParamsOpenApiSchema,
  WorkOrdersListQueryParamsSchema,
  WorkOrdersListResponseSchema,
  ServiceContractCreateRequestSchema,
  ServiceContractIdParamsOpenApiSchema,
  ServiceContractMaterializeRequestSchema,
  ServiceContractOccurrencesResponseSchema,
  ServiceContractResponseSchema,
  ServiceContractUpdateRequestSchema,
  ServiceContractsListQueryParamsSchema,
  ServiceContractsListResponseSchema,
} from "../components/fsm.schemas.js";
import { Tags } from "../tags.js";
import { z } from "../zod.js";

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

  registry.registerPath({
    method: "get",
    path: "/api/work-templates",
    summary: "List work templates",
    description: "Search and paginate work templates.",
    tags: [Tags.WorkTemplates],
    security: [{ BearerAuth: [] }],
    request: { query: WorkTemplatesListQueryParamsSchema },
    responses: {
      200: {
        description: "Work template list.",
        content: { "application/json": { schema: WorkTemplatesListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/work-templates",
    summary: "Create work template",
    description: "Create a work template with tasks and skill requirements.",
    tags: [Tags.WorkTemplates],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: { "application/json": { schema: WorkTemplateCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Work template created.",
        content: { "application/json": { schema: WorkTemplateResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/work-templates/{id}",
    summary: "Get work template",
    description: "Fetch a work template with tasks and skill requirements.",
    tags: [Tags.WorkTemplates],
    security: [{ BearerAuth: [] }],
    request: { params: WorkTemplateIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Work template found.",
        content: { "application/json": { schema: WorkTemplateResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work template not found", {
        message: "Work template not found",
        code: "WORK_TEMPLATE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/work-templates/{id}",
    summary: "Update work template",
    description: "Update a work template and replace tasks/requirements when provided.",
    tags: [Tags.WorkTemplates],
    security: [{ BearerAuth: [] }],
    request: {
      params: WorkTemplateIdParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: WorkTemplateUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Work template updated.",
        content: { "application/json": { schema: WorkTemplateResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work template not found", {
        message: "Work template not found",
        code: "WORK_TEMPLATE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/work-templates/{id}",
    summary: "Delete work template",
    description: "Delete a work template.",
    tags: [Tags.WorkTemplates],
    security: [{ BearerAuth: [] }],
    request: { params: WorkTemplateIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Work template deleted.",
        content: { "application/json": { schema: z.object({ deleted: z.boolean() }) } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work template not found", {
        message: "Work template not found",
        code: "WORK_TEMPLATE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/work-orders/{id}/incidents",
    summary: "Add work order incident",
    description: "Add an incident to a work order, optionally from a template.",
    tags: [Tags.WorkOrders],
    security: [{ BearerAuth: [] }],
    request: {
      params: WorkOrderIdParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: WorkOrderIncidentCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Incident created.",
        content: { "application/json": { schema: WorkOrderIncidentResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work order not found", {
        message: "Work order not found",
        code: "WORK_ORDER_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/work-orders/{id}/incidents/{incidentId}/tasks/instantiate",
    summary: "Instantiate work order tasks",
    description: "Create tasks for an incident using a template.",
    tags: [Tags.WorkOrders],
    security: [{ BearerAuth: [] }],
    request: {
      params: WorkOrderIncidentParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: WorkOrderTaskInstantiateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Tasks created.",
        content: { "application/json": { schema: WorkOrderTasksResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work order incident not found", {
        message: "Work order incident not found",
        code: "WORK_ORDER_INCIDENT_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/work-orders/{id}/tasks/{taskId}/status",
    summary: "Update work order task status",
    description: "Update task status and return completion readiness.",
    tags: [Tags.WorkOrders],
    security: [{ BearerAuth: [] }],
    request: {
      params: WorkOrderTaskParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: WorkOrderTaskStatusUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Task updated.",
        content: { "application/json": { schema: WorkOrderTaskStatusUpdateResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Work order task not found", {
        message: "Work order task not found",
        code: "WORK_ORDER_TASK_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/service-contracts",
    summary: "List service contracts",
    description: "Search and paginate recurring service contracts.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: { query: ServiceContractsListQueryParamsSchema },
    responses: {
      200: {
        description: "Service contract list.",
        content: { "application/json": { schema: ServiceContractsListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/service-contracts",
    summary: "Create service contract",
    description: "Create a recurring service contract with items and a recurrence rule.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: { "application/json": { schema: ServiceContractCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Service contract created.",
        content: { "application/json": { schema: ServiceContractResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/service-contracts/{id}",
    summary: "Get service contract",
    description: "Fetch a service contract with items and recurrence rule.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: { params: ServiceContractIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Service contract found.",
        content: { "application/json": { schema: ServiceContractResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service contract not found", {
        message: "Service contract not found",
        code: "SERVICE_CONTRACT_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/service-contracts/{id}",
    summary: "Update service contract",
    description: "Update a service contract and replace items when provided.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: {
      params: ServiceContractIdParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: ServiceContractUpdateRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Service contract updated.",
        content: { "application/json": { schema: ServiceContractResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service contract not found", {
        message: "Service contract not found",
        code: "SERVICE_CONTRACT_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/service-contracts/{id}",
    summary: "Delete service contract",
    description: "Delete a service contract.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: { params: ServiceContractIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Service contract deleted.",
        content: { "application/json": { schema: z.object({ deleted: z.boolean() }) } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service contract not found", {
        message: "Service contract not found",
        code: "SERVICE_CONTRACT_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/service-contracts/{id}/materialize",
    summary: "Materialize service contract occurrences",
    description: "Generate and store the next occurrences for a service contract.",
    tags: [Tags.ServiceContracts],
    security: [{ BearerAuth: [] }],
    request: {
      params: ServiceContractIdParamsOpenApiSchema,
      body: {
        content: { "application/json": { schema: ServiceContractMaterializeRequestSchema } },
      },
    },
    responses: {
      200: {
        description: "Occurrences materialized.",
        content: { "application/json": { schema: ServiceContractOccurrencesResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service contract not found", {
        message: "Service contract not found",
        code: "SERVICE_CONTRACT_NOT_FOUND",
      }),
    },
  });
}
