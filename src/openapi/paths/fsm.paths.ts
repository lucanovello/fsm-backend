import {
  errorResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from "../components/errors.js";
import {
  BookingCreateRequestSchema,
  BookingIdParamsOpenApiSchema,
  BookingResponseSchema,
  BookingStatusChangeRequestSchema,
  BookingStatusChangeResponseSchema,
  BookingUpdateRequestSchema,
  BookingWithRequirementsResponseSchema,
  CrewCreateRequestSchema,
  CrewDetailResponseSchema,
  CrewIdParamsOpenApiSchema,
  CrewMemberCreateRequestSchema,
  CrewMemberParamsOpenApiSchema,
  CrewMemberResponseSchema,
  CrewResponseSchema,
  CrewUpdateRequestSchema,
  CrewsListQueryParamsSchema,
  CrewsListResponseSchema,
  CustomerDetailResponseSchema,
  CustomerIdParamsOpenApiSchema,
  CustomersListQueryParamsSchema,
  CustomersListResponseSchema,
  DeleteResponseSchema,
  GeoDeviceCreateRequestSchema,
  GeoDeviceResponseSchema,
  GeoPingBatchIngestRequestSchema,
  GeoPingIngestResponseSchema,
  GeoPingListResponseSchema,
  GeoPingResponseSchema,
  GeoPingsQueryParamsSchema,
  GeoResourceIdParamsOpenApiSchema,
  InvoiceCreateRequestSchema,
  InvoiceDeleteResponseSchema,
  InvoiceIdParamsOpenApiSchema,
  InvoiceLineCreateRequestSchema,
  InvoiceLineIdParamsOpenApiSchema,
  InvoiceLineResponseSchema,
  InvoiceLineUpdateRequestSchema,
  InvoiceResponseSchema,
  InvoiceStatusUpdateRequestSchema,
  InvoiceWorkOrderIdParamsOpenApiSchema,
  InvoiceWorkOrdersAddRequestSchema,
  RouteCreateRequestSchema,
  RouteIdParamsOpenApiSchema,
  RouteResponseSchema,
  RouteStopAddRequestSchema,
  RouteStopIdParamsOpenApiSchema,
  RouteStopReorderRequestSchema,
  RouteStopResponseSchema,
  RouteStopsResponseSchema,
  ServiceContractCreateRequestSchema,
  ServiceContractIdParamsOpenApiSchema,
  ServiceContractMaterializeRequestSchema,
  ServiceContractOccurrencesResponseSchema,
  ServiceContractResponseSchema,
  ServiceContractUpdateRequestSchema,
  ServiceContractsListQueryParamsSchema,
  ServiceContractsListResponseSchema,
  ServiceResourceCreateRequestSchema,
  ServiceResourceIdParamsOpenApiSchema,
  ServiceResourceResponseSchema,
  ServiceResourcesListQueryParamsSchema,
  ServiceResourcesListResponseSchema,
  ServiceResourceUpdateRequestSchema,
  TechniciansListQueryParamsSchema,
  TechniciansListResponseSchema,
  WorkOrderDetailResponseSchema,
  WorkOrderIdParamsOpenApiSchema,
  WorkOrderIncidentCreateRequestSchema,
  WorkOrderIncidentParamsOpenApiSchema,
  WorkOrderIncidentResponseSchema,
  WorkOrderTaskInstantiateRequestSchema,
  WorkOrderTaskParamsOpenApiSchema,
  WorkOrderTaskStatusUpdateRequestSchema,
  WorkOrderTaskStatusUpdateResponseSchema,
  WorkOrderTasksResponseSchema,
  WorkOrdersListQueryParamsSchema,
  WorkOrdersListResponseSchema,
  WorkTemplateCreateRequestSchema,
  WorkTemplateIdParamsOpenApiSchema,
  WorkTemplateResponseSchema,
  WorkTemplateUpdateRequestSchema,
  WorkTemplatesListQueryParamsSchema,
  WorkTemplatesListResponseSchema,
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
    path: "/api/service-resources",
    summary: "List service resources",
    description: "Search and paginate service resources by name or email.",
    tags: [Tags.ServiceResources],
    security: [{ BearerAuth: [] }],
    request: { query: ServiceResourcesListQueryParamsSchema },
    responses: {
      200: {
        description: "Service resource list.",
        content: { "application/json": { schema: ServiceResourcesListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/service-resources",
    summary: "Create service resource",
    description: "Create a new service resource and optionally link an org member.",
    tags: [Tags.ServiceResources],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: { "application/json": { schema: ServiceResourceCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Service resource created.",
        content: { "application/json": { schema: ServiceResourceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Org member not found", {
        message: "Org member not found",
        code: "ORG_MEMBER_NOT_FOUND",
      }),
      409: errorResponse("Org member already assigned", {
        message: "Org member already assigned",
        code: "ORG_MEMBER_ASSIGNED",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/service-resources/{id}",
    summary: "Get service resource",
    description: "Fetch a service resource profile.",
    tags: [Tags.ServiceResources],
    security: [{ BearerAuth: [] }],
    request: { params: ServiceResourceIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Service resource found.",
        content: { "application/json": { schema: ServiceResourceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/service-resources/{id}",
    summary: "Update service resource",
    description: "Update a service resource profile.",
    tags: [Tags.ServiceResources],
    security: [{ BearerAuth: [] }],
    request: {
      params: ServiceResourceIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: ServiceResourceUpdateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Service resource updated.",
        content: { "application/json": { schema: ServiceResourceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
      409: errorResponse("Org member already assigned", {
        message: "Org member already assigned",
        code: "ORG_MEMBER_ASSIGNED",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/service-resources/{id}",
    summary: "Delete service resource",
    description: "Delete a service resource.",
    tags: [Tags.ServiceResources],
    security: [{ BearerAuth: [] }],
    request: { params: ServiceResourceIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Service resource deleted.",
        content: { "application/json": { schema: DeleteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/crews",
    summary: "List crews",
    description: "Search and paginate crews.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: { query: CrewsListQueryParamsSchema },
    responses: {
      200: {
        description: "Crew list.",
        content: { "application/json": { schema: CrewsListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/crews",
    summary: "Create crew",
    description: "Create a new crew.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: CrewCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Crew created.",
        content: { "application/json": { schema: CrewResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      409: errorResponse("Crew name unavailable", {
        message: "Crew name unavailable",
        code: "CREW_NAME_TAKEN",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/crews/{id}",
    summary: "Get crew",
    description: "Fetch a crew with members.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: { params: CrewIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Crew found.",
        content: { "application/json": { schema: CrewDetailResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/crews/{id}",
    summary: "Update crew",
    description: "Update a crew.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: {
      params: CrewIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: CrewUpdateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Crew updated.",
        content: { "application/json": { schema: CrewResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
      409: errorResponse("Crew name unavailable", {
        message: "Crew name unavailable",
        code: "CREW_NAME_TAKEN",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/crews/{id}",
    summary: "Delete crew",
    description: "Delete a crew.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: { params: CrewIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Crew deleted.",
        content: { "application/json": { schema: DeleteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/crews/{id}/members",
    summary: "Add crew member",
    description: "Add a service resource to a crew.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: {
      params: CrewIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: CrewMemberCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Crew member added.",
        content: { "application/json": { schema: CrewMemberResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/crews/{id}/members/{resourceId}",
    summary: "Remove crew member",
    description: "Remove a service resource from a crew.",
    tags: [Tags.Crews],
    security: [{ BearerAuth: [] }],
    request: { params: CrewMemberParamsOpenApiSchema },
    responses: {
      200: {
        description: "Crew member removed.",
        content: { "application/json": { schema: DeleteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew member not found", {
        message: "Crew member not found",
        code: "CREW_MEMBER_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/scheduling/bookings",
    summary: "Create booking",
    description: "Create a booking for a crew and optional work order.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: BookingCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Booking created.",
        content: { "application/json": { schema: BookingWithRequirementsResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
      409: errorResponse("Booking already exists for work order", {
        message: "Booking already exists for work order",
        code: "BOOKING_ALREADY_EXISTS",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/scheduling/bookings/{id}",
    summary: "Update booking",
    description: "Update booking details.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      params: BookingIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: BookingUpdateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Booking updated.",
        content: { "application/json": { schema: BookingResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Booking not found", {
        message: "Booking not found",
        code: "BOOKING_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/scheduling/bookings/{id}/status",
    summary: "Change booking status",
    description: "Transition booking status and emit a status event.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      params: BookingIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: BookingStatusChangeRequestSchema } } },
    },
    responses: {
      200: {
        description: "Booking status updated.",
        content: { "application/json": { schema: BookingStatusChangeResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Booking not found", {
        message: "Booking not found",
        code: "BOOKING_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/scheduling/routes",
    summary: "Create route",
    description: "Create a daily route for a crew.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: RouteCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Route created.",
        content: { "application/json": { schema: RouteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Crew not found", {
        message: "Crew not found",
        code: "CREW_NOT_FOUND",
      }),
      409: errorResponse("Route already exists for crew/date", {
        message: "Route already exists for crew/date",
        code: "ROUTE_ALREADY_EXISTS",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/scheduling/routes/{id}/stops",
    summary: "Add route stop",
    description: "Add a booking to a route.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      params: RouteIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: RouteStopAddRequestSchema } } },
    },
    responses: {
      201: {
        description: "Route stop added.",
        content: { "application/json": { schema: RouteStopResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Route not found", {
        message: "Route not found",
        code: "ROUTE_NOT_FOUND",
      }),
      409: errorResponse("Booking crew does not match route", {
        message: "Booking crew does not match route",
        code: "BOOKING_CREW_MISMATCH",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/scheduling/routes/{id}/stops/reorder",
    summary: "Reorder route stops",
    description: "Reorder route stops for a route.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: {
      params: RouteIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: RouteStopReorderRequestSchema } } },
    },
    responses: {
      200: {
        description: "Route stops reordered.",
        content: { "application/json": { schema: RouteStopsResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Route not found", {
        message: "Route not found",
        code: "ROUTE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/scheduling/routes/{id}/stops/{stopId}",
    summary: "Remove route stop",
    description: "Remove a stop from a route.",
    tags: [Tags.Scheduling],
    security: [{ BearerAuth: [] }],
    request: { params: RouteStopIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Route stop removed.",
        content: { "application/json": { schema: DeleteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Route stop not found", {
        message: "Route stop not found",
        code: "ROUTE_STOP_NOT_FOUND",
      }),
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
    path: "/api/invoices",
    summary: "Create invoice",
    description: "Create an invoice for a customer.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: {
      body: {
        content: { "application/json": { schema: InvoiceCreateRequestSchema } },
      },
    },
    responses: {
      201: {
        description: "Invoice created.",
        content: { "application/json": { schema: InvoiceResponseSchema } },
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
    path: "/api/invoices/{id}",
    summary: "Get invoice",
    description: "Fetch an invoice with linked work orders and lines.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: { params: InvoiceIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Invoice found.",
        content: { "application/json": { schema: InvoiceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice not found", {
        message: "Invoice not found",
        code: "INVOICE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/invoices/{id}/work-orders",
    summary: "Add invoice work orders",
    description: "Attach work orders to a draft invoice.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: {
      params: InvoiceIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: InvoiceWorkOrdersAddRequestSchema } } },
    },
    responses: {
      200: {
        description: "Work orders added.",
        content: { "application/json": { schema: InvoiceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice not found", {
        message: "Invoice not found",
        code: "INVOICE_NOT_FOUND",
      }),
      409: errorResponse("Invoice must be in draft", {
        message: "Invoice must be in draft",
        code: "INVOICE_NOT_DRAFT",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/invoices/{id}/work-orders/{workOrderId}",
    summary: "Remove invoice work order",
    description: "Remove a work order from a draft invoice.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: { params: InvoiceWorkOrderIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Work order removed.",
        content: { "application/json": { schema: InvoiceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice work order not found", {
        message: "Invoice work order not found",
        code: "INVOICE_WORK_ORDER_NOT_FOUND",
      }),
      409: errorResponse("Invoice must be in draft", {
        message: "Invoice must be in draft",
        code: "INVOICE_NOT_DRAFT",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/invoices/{id}/lines",
    summary: "Create invoice line",
    description: "Add a line to a draft invoice.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: {
      params: InvoiceIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: InvoiceLineCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Line created.",
        content: { "application/json": { schema: InvoiceLineResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice not found", {
        message: "Invoice not found",
        code: "INVOICE_NOT_FOUND",
      }),
      409: errorResponse("Invoice must be in draft", {
        message: "Invoice must be in draft",
        code: "INVOICE_NOT_DRAFT",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/invoices/{id}/lines/{lineId}",
    summary: "Update invoice line",
    description: "Update a line on a draft invoice.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: {
      params: InvoiceLineIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: InvoiceLineUpdateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Line updated.",
        content: { "application/json": { schema: InvoiceLineResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice line not found", {
        message: "Invoice line not found",
        code: "INVOICE_LINE_NOT_FOUND",
      }),
      409: errorResponse("Invoice must be in draft", {
        message: "Invoice must be in draft",
        code: "INVOICE_NOT_DRAFT",
      }),
    },
  });

  registry.registerPath({
    method: "delete",
    path: "/api/invoices/{id}/lines/{lineId}",
    summary: "Delete invoice line",
    description: "Delete a line from a draft invoice.",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: { params: InvoiceLineIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Line deleted.",
        content: { "application/json": { schema: InvoiceDeleteResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice line not found", {
        message: "Invoice line not found",
        code: "INVOICE_LINE_NOT_FOUND",
      }),
      409: errorResponse("Invoice must be in draft", {
        message: "Invoice must be in draft",
        code: "INVOICE_NOT_DRAFT",
      }),
    },
  });

  registry.registerPath({
    method: "patch",
    path: "/api/invoices/{id}/status",
    summary: "Update invoice status",
    description: "Transition invoice status (draft/issued/paid/void).",
    tags: [Tags.Invoices],
    security: [{ BearerAuth: [] }],
    request: {
      params: InvoiceIdParamsOpenApiSchema,
      body: { content: { "application/json": { schema: InvoiceStatusUpdateRequestSchema } } },
    },
    responses: {
      200: {
        description: "Invoice updated.",
        content: { "application/json": { schema: InvoiceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Invoice not found", {
        message: "Invoice not found",
        code: "INVOICE_NOT_FOUND",
      }),
      409: errorResponse("Invalid invoice status transition", {
        message: "Invalid invoice status transition",
        code: "INVOICE_STATUS_INVALID_TRANSITION",
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

  registry.registerPath({
    method: "post",
    path: "/api/geo/devices",
    summary: "Register geo device",
    description: "Register a tracking device for a service resource.",
    tags: [Tags.GeoTracking],
    security: [{ BearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: GeoDeviceCreateRequestSchema } } },
    },
    responses: {
      201: {
        description: "Geo device registered.",
        content: { "application/json": { schema: GeoDeviceResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
      409: errorResponse("Geo device identifier already registered", {
        message: "Geo device identifier already registered",
        code: "GEO_DEVICE_IDENTIFIER_TAKEN",
      }),
    },
  });

  registry.registerPath({
    method: "post",
    path: "/api/geo/pings",
    summary: "Ingest geo pings",
    description: "Batch ingest geo pings for devices.",
    tags: [Tags.GeoTracking],
    security: [{ BearerAuth: [] }],
    request: {
      body: { content: { "application/json": { schema: GeoPingBatchIngestRequestSchema } } },
    },
    responses: {
      202: {
        description: "Geo pings accepted.",
        content: { "application/json": { schema: GeoPingIngestResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Geo device not found", {
        message: "Geo device not found",
        code: "GEO_DEVICE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/geo/resources/{resourceId}/latest",
    summary: "Get latest geo ping",
    description: "Fetch the latest location for a service resource.",
    tags: [Tags.GeoTracking],
    security: [{ BearerAuth: [] }],
    request: { params: GeoResourceIdParamsOpenApiSchema },
    responses: {
      200: {
        description: "Latest geo ping.",
        content: { "application/json": { schema: GeoPingResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
    },
  });

  registry.registerPath({
    method: "get",
    path: "/api/geo/resources/{resourceId}/pings",
    summary: "List geo pings",
    description: "List geo pings for a service resource.",
    tags: [Tags.GeoTracking],
    security: [{ BearerAuth: [] }],
    request: {
      params: GeoResourceIdParamsOpenApiSchema,
      query: GeoPingsQueryParamsSchema,
    },
    responses: {
      200: {
        description: "Geo pings.",
        content: { "application/json": { schema: GeoPingListResponseSchema } },
      },
      400: validationErrorResponse,
      401: unauthorizedResponse,
      404: errorResponse("Service resource not found", {
        message: "Service resource not found",
        code: "SERVICE_RESOURCE_NOT_FOUND",
      }),
    },
  });
}
