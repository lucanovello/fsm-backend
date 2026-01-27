import {
  CustomerIdParamsSchema,
  CustomersListQuerySchema,
} from "../../modules/customers/dto/customers.dto.js";
import { TechniciansListQuerySchema } from "../../modules/technicians/dto/technicians.dto.js";
import {
  WorkOrderIdParamsSchema,
  WorkOrderIncidentCreateSchema,
  WorkOrderIncidentParamsSchema,
  WorkOrderTaskInstantiateSchema,
  WorkOrderTaskParamsSchema,
  WorkOrderTaskStatusUpdateSchema,
  WorkOrdersListQuerySchema,
} from "../../modules/work-orders/dto/workOrders.dto.js";
import {
  WorkTemplateCreateSchema,
  WorkTemplateIdParamsSchema,
  WorkTemplateUpdateSchema,
  WorkTemplatesListQuerySchema,
} from "../../modules/work-templates/dto/workTemplates.dto.js";
import { z } from "../zod.js";

import type { OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";

export const CustomerListItemSchema = z
  .object({
    id: z.string().openapi({ example: "cust_1" }),
    name: z.string().openapi({ example: "Acme Corp" }),
    email: z.string().email().nullable().openapi({ example: "ops@acme.example" }),
    phone: z.string().nullable().openapi({ example: "+1-555-0100" }),
  })
  .openapi("CustomerListItem");

export const CustomersListResponseSchema = z
  .object({
    items: z.array(CustomerListItemSchema),
    page: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 25 }),
    total: z.number().int().openapi({ example: 42 }),
  })
  .openapi("CustomersListResponse", {
    example: {
      items: [{ id: "cust_1", name: "Acme Corp", email: "ops@acme.example", phone: "+1-555-0100" }],
      page: 1,
      pageSize: 25,
      total: 42,
    },
  });

export const CustomerLocationSchema = z
  .object({
    id: z.string().openapi({ example: "loc_1" }),
    label: z.string().nullable().openapi({ example: "Head Office" }),
    addressLine1: z.string().openapi({ example: "100 King St W" }),
    addressLine2: z.string().nullable().openapi({ example: "Suite 1200" }),
    city: z.string().openapi({ example: "Toronto" }),
    province: z.string().nullable().openapi({ example: "ON" }),
    postalCode: z.string().nullable().openapi({ example: "M5X 1A9" }),
    country: z.string().nullable().openapi({ example: "CA" }),
    latitude: z.number().nullable().openapi({ example: 43.6487 }),
    longitude: z.number().nullable().openapi({ example: -79.3854 }),
  })
  .openapi("CustomerLocation");

export const WorkOrderStatusSchema = z
  .enum(["DRAFT", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"])
  .openapi("WorkOrderStatus", { example: "SCHEDULED" });

export const WorkOrderPrioritySchema = z
  .enum(["LOW", "NORMAL", "HIGH", "URGENT"])
  .openapi("WorkOrderPriority", { example: "HIGH" });

export const TaskStatusSchema = z
  .enum(["TODO", "DONE", "SKIPPED"])
  .openapi("TaskStatus", { example: "TODO" });

export const CustomerRecentWorkOrderSchema = z
  .object({
    id: z.string().openapi({ example: "wo_123" }),
    summary: z.string().openapi({ example: "Spring cleanup & inspection" }),
    status: WorkOrderStatusSchema,
    priority: WorkOrderPrioritySchema,
    scheduledStart: z.string().datetime().nullable().openapi({ example: "2025-04-12T09:00:00Z" }),
    scheduledEnd: z.string().datetime().nullable().openapi({ example: "2025-04-12T11:00:00Z" }),
    location: z
      .object({
        id: z.string().openapi({ example: "loc_1" }),
        label: z.string().nullable().openapi({ example: "Head Office" }),
        city: z.string().openapi({ example: "Toronto" }),
      })
      .openapi("CustomerRecentWorkOrderLocation"),
    assignedTechnician: z
      .object({ id: z.string().openapi({ example: "tech_1" }), displayName: z.string() })
      .nullable()
      .openapi("CustomerRecentWorkOrderTechnician"),
  })
  .openapi("CustomerRecentWorkOrder");

export const CustomerDetailResponseSchema = z
  .object({
    customer: CustomerListItemSchema,
    locations: z.array(CustomerLocationSchema),
    recentWorkOrders: z.array(CustomerRecentWorkOrderSchema),
  })
  .openapi("CustomerDetailResponse", {
    example: {
      customer: {
        id: "cust_1",
        name: "Acme Corp",
        email: "ops@acme.example",
        phone: "+1-555-0100",
      },
      locations: [
        {
          id: "loc_1",
          label: "Head Office",
          addressLine1: "100 King St W",
          addressLine2: "Suite 1200",
          city: "Toronto",
          province: "ON",
          postalCode: "M5X 1A9",
          country: "CA",
          latitude: 43.6487,
          longitude: -79.3854,
        },
      ],
      recentWorkOrders: [
        {
          id: "wo_123",
          summary: "Spring cleanup & inspection",
          status: "SCHEDULED",
          priority: "HIGH",
          scheduledStart: "2025-04-12T09:00:00Z",
          scheduledEnd: "2025-04-12T11:00:00Z",
          location: { id: "loc_1", label: "Head Office", city: "Toronto" },
          assignedTechnician: { id: "tech_1", displayName: "Alex Tech" },
        },
      ],
    },
  });

export const TechnicianListItemSchema = z
  .object({
    id: z.string().openapi({ example: "tech_1" }),
    displayName: z.string().openapi({ example: "Alex Tech" }),
    email: z.string().email().openapi({ example: "alex.tech@example.com" }),
    phone: z.string().nullable().openapi({ example: "+1-555-0111" }),
  })
  .openapi("TechnicianListItem");

export const TechniciansListResponseSchema = z
  .object({
    items: z.array(TechnicianListItemSchema),
    page: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 100 }),
    total: z.number().int().openapi({ example: 2 }),
  })
  .openapi("TechniciansListResponse", {
    example: {
      items: [
        {
          id: "tech_1",
          displayName: "Alex Tech",
          email: "alex.tech@example.com",
          phone: "+1-555-0111",
        },
      ],
      page: 1,
      pageSize: 100,
      total: 2,
    },
  });

export const WorkOrderListItemSchema = z
  .object({
    id: z.string().openapi({ example: "wo_123" }),
    summary: z.string().openapi({ example: "Spring cleanup & inspection" }),
    status: WorkOrderStatusSchema,
    priority: WorkOrderPrioritySchema,
    scheduledStart: z.string().datetime().nullable().openapi({ example: "2025-04-12T09:00:00Z" }),
    scheduledEnd: z.string().datetime().nullable().openapi({ example: "2025-04-12T11:00:00Z" }),
    customer: z
      .object({ id: z.string().openapi({ example: "cust_1" }), name: z.string() })
      .openapi("WorkOrderCustomerSummary"),
    location: z
      .object({
        id: z.string().openapi({ example: "loc_1" }),
        label: z.string().nullable(),
        city: z.string(),
      })
      .openapi("WorkOrderLocationSummary"),
    assignedTechnician: z
      .object({ id: z.string().openapi({ example: "tech_1" }), displayName: z.string() })
      .nullable()
      .openapi("WorkOrderTechnicianSummary"),
  })
  .openapi("WorkOrderListItem");

export const WorkOrdersListResponseSchema = z
  .object({
    items: z.array(WorkOrderListItemSchema),
    page: z.number().int().openapi({ example: 1 }),
    pageSize: z.number().int().openapi({ example: 25 }),
    total: z.number().int().openapi({ example: 2 }),
  })
  .openapi("WorkOrdersListResponse", {
    example: {
      items: [
        {
          id: "wo_123",
          summary: "Spring cleanup & inspection",
          status: "SCHEDULED",
          priority: "HIGH",
          scheduledStart: "2025-04-12T09:00:00Z",
          scheduledEnd: "2025-04-12T11:00:00Z",
          customer: { id: "cust_1", name: "Acme Corp" },
          location: { id: "loc_1", label: "Head Office", city: "Toronto" },
          assignedTechnician: { id: "tech_1", displayName: "Alex Tech" },
        },
      ],
      page: 1,
      pageSize: 25,
      total: 2,
    },
  });

export const WorkOrderNoteSchema = z
  .object({
    id: z.string().openapi({ example: "note_1" }),
    author: z
      .object({ id: z.string().openapi({ example: "user_1" }), email: z.string().email() })
      .openapi("WorkOrderNoteAuthor"),
    body: z.string().openapi({ example: "Arrived on-site, starting inspection." }),
    createdAt: z.string().datetime().openapi({ example: "2025-04-12T09:05:00Z" }),
  })
  .openapi("WorkOrderNote");

export const WorkOrderLineItemSchema = z
  .object({
    id: z.string().openapi({ example: "li_1" }),
    description: z.string().openapi({ example: "HVAC filter replacement" }),
    quantity: z.number().int().openapi({ example: 2 }),
    unitPriceCents: z.number().int().openapi({ example: 1299 }),
  })
  .openapi("WorkOrderLineItem");

export const WorkOrderDetailResponseSchema = z
  .object({
    id: z.string().openapi({ example: "wo_123" }),
    summary: z.string().openapi({ example: "Spring cleanup & inspection" }),
    description: z
      .string()
      .nullable()
      .openapi({ example: "Quarterly HVAC inspection and filter replacement." }),
    status: WorkOrderStatusSchema,
    priority: WorkOrderPrioritySchema,
    scheduledStart: z.string().datetime().nullable().openapi({ example: "2025-04-12T09:00:00Z" }),
    scheduledEnd: z.string().datetime().nullable().openapi({ example: "2025-04-12T11:00:00Z" }),
    actualStart: z.string().datetime().nullable().openapi({ example: null }),
    actualEnd: z.string().datetime().nullable().openapi({ example: null }),
    customer: z
      .object({ id: z.string().openapi({ example: "cust_1" }), name: z.string() })
      .openapi("WorkOrderCustomerDetail"),
    location: z
      .object({
        id: z.string().openapi({ example: "loc_1" }),
        label: z.string().nullable().openapi({ example: "Head Office" }),
        addressLine1: z.string().openapi({ example: "100 King St W" }),
        addressLine2: z.string().nullable().openapi({ example: "Suite 1200" }),
        city: z.string().openapi({ example: "Toronto" }),
        province: z.string().nullable().openapi({ example: "ON" }),
        postalCode: z.string().nullable().openapi({ example: "M5X 1A9" }),
        country: z.string().nullable().openapi({ example: "CA" }),
      })
      .openapi("WorkOrderLocationDetail"),
    assignedTechnician: z
      .object({ id: z.string().openapi({ example: "tech_1" }), displayName: z.string() })
      .nullable()
      .openapi("WorkOrderTechnicianDetail"),
    notes: z.array(WorkOrderNoteSchema),
    lineItems: z.array(WorkOrderLineItemSchema),
  })
  .openapi("WorkOrderDetailResponse", {
    example: {
      id: "wo_123",
      summary: "Spring cleanup & inspection",
      description: "Quarterly HVAC inspection and filter replacement.",
      status: "SCHEDULED",
      priority: "HIGH",
      scheduledStart: "2025-04-12T09:00:00Z",
      scheduledEnd: "2025-04-12T11:00:00Z",
      actualStart: null,
      actualEnd: null,
      customer: { id: "cust_1", name: "Acme Corp" },
      location: {
        id: "loc_1",
        label: "Head Office",
        addressLine1: "100 King St W",
        addressLine2: "Suite 1200",
        city: "Toronto",
        province: "ON",
        postalCode: "M5X 1A9",
        country: "CA",
      },
      assignedTechnician: { id: "tech_1", displayName: "Alex Tech" },
      notes: [
        {
          id: "note_1",
          author: { id: "user_1", email: "alex.tech@example.com" },
          body: "Arrived on-site, starting inspection.",
          createdAt: "2025-04-12T09:05:00Z",
        },
      ],
      lineItems: [
        {
          id: "li_1",
          description: "HVAC filter replacement",
          quantity: 2,
          unitPriceCents: 1299,
        },
      ],
    },
  });

export const CompletionReadinessSchema = z
  .object({
    total: z.number().int().nonnegative(),
    done: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative(),
    pending: z.number().int().nonnegative(),
    isReady: z.boolean(),
  })
  .openapi("CompletionReadiness", {
    example: { total: 3, done: 2, skipped: 1, pending: 0, isReady: true },
  });

export const WorkOrderIncidentSchema = z
  .object({
    id: z.string().openapi({ example: "inc_1" }),
    workOrderId: z.string().openapi({ example: "wo_123" }),
    templateId: z.string().nullable().openapi({ example: "tpl_1" }),
    title: z.string().openapi({ example: "Leak Investigation" }),
    description: z.string().nullable().openapi({ example: "Inspect irrigation leak" }),
    sortOrder: z.number().int().openapi({ example: 0 }),
    createdAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
  })
  .openapi("WorkOrderIncident");

export const WorkOrderIncidentResponseSchema = z
  .object({
    incident: WorkOrderIncidentSchema,
  })
  .openapi("WorkOrderIncidentResponse");

export const WorkOrderTaskSchema = z
  .object({
    id: z.string().openapi({ example: "task_1" }),
    incidentId: z.string().openapi({ example: "inc_1" }),
    title: z.string().openapi({ example: "Replace valve" }),
    description: z.string().nullable().openapi({ example: "Install new valve" }),
    status: TaskStatusSchema,
    sortOrder: z.number().int().openapi({ example: 0 }),
    completedAt: z.string().datetime().nullable().openapi({ example: null }),
    createdAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
  })
  .openapi("WorkOrderTask");

export const WorkOrderTasksResponseSchema = z
  .object({
    tasks: z.array(WorkOrderTaskSchema),
  })
  .openapi("WorkOrderTasksResponse");

export const WorkOrderTaskStatusUpdateResponseSchema = z
  .object({
    task: WorkOrderTaskSchema,
    readiness: CompletionReadinessSchema,
  })
  .openapi("WorkOrderTaskStatusUpdateResponse");

export const WorkTemplateTaskSchema = z
  .object({
    id: z.string().openapi({ example: "tpl_task_1" }),
    title: z.string().openapi({ example: "Inspect pump" }),
    description: z.string().nullable().openapi({ example: "Check pump pressure" }),
    sortOrder: z.number().int().openapi({ example: 0 }),
  })
  .openapi("WorkTemplateTask");

export const WorkTemplateSkillRequirementSchema = z
  .object({
    id: z.string().openapi({ example: "tpl_skill_1" }),
    skillId: z.string().openapi({ example: "skill_1" }),
    quantity: z.number().int().openapi({ example: 1 }),
    notes: z.string().nullable().openapi({ example: "Requires certified tech" }),
    skill: z
      .object({ id: z.string().openapi({ example: "skill_1" }), name: z.string() })
      .openapi("WorkTemplateSkill"),
  })
  .openapi("WorkTemplateSkillRequirement");

export const WorkTemplateListItemSchema = z
  .object({
    id: z.string().openapi({ example: "tpl_1" }),
    name: z.string().openapi({ example: "Spring Cleanup" }),
    description: z.string().nullable().openapi({ example: "Seasonal cleanup" }),
    isActive: z.boolean().openapi({ example: true }),
    taskCount: z.number().int().openapi({ example: 4 }),
    createdAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
  })
  .openapi("WorkTemplateListItem");

export const WorkTemplatesListResponseSchema = z
  .object({
    items: z.array(WorkTemplateListItemSchema),
    page: z.number().int(),
    pageSize: z.number().int(),
    total: z.number().int(),
  })
  .openapi("WorkTemplatesListResponse");

export const WorkTemplateDetailSchema = z
  .object({
    id: z.string().openapi({ example: "tpl_1" }),
    name: z.string().openapi({ example: "Spring Cleanup" }),
    description: z.string().nullable().openapi({ example: "Seasonal cleanup" }),
    isActive: z.boolean().openapi({ example: true }),
    createdAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
    updatedAt: z.string().datetime().openapi({ example: "2025-04-12T09:00:00Z" }),
    tasks: z.array(WorkTemplateTaskSchema),
    skillRequirements: z.array(WorkTemplateSkillRequirementSchema),
  })
  .openapi("WorkTemplateDetail");

export const WorkTemplateResponseSchema = z
  .object({
    template: WorkTemplateDetailSchema,
  })
  .openapi("WorkTemplateResponse");

export const CustomersListQueryParamsSchema = CustomersListQuerySchema.openapi(
  "CustomersListQueryParams",
);
export const CustomerIdParamsOpenApiSchema = CustomerIdParamsSchema.openapi("CustomerIdParams");

export const TechniciansListQueryParamsSchema = TechniciansListQuerySchema.openapi(
  "TechniciansListQueryParams",
);

export const WorkOrdersListQueryParamsSchema = WorkOrdersListQuerySchema.openapi(
  "WorkOrdersListQueryParams",
);
export const WorkOrderIdParamsOpenApiSchema = WorkOrderIdParamsSchema.openapi("WorkOrderIdParams");

export const WorkTemplatesListQueryParamsSchema = WorkTemplatesListQuerySchema.openapi(
  "WorkTemplatesListQueryParams",
);
export const WorkTemplateIdParamsOpenApiSchema =
  WorkTemplateIdParamsSchema.openapi("WorkTemplateIdParams");
export const WorkTemplateCreateRequestSchema = WorkTemplateCreateSchema.openapi(
  "WorkTemplateCreateRequest",
);
export const WorkTemplateUpdateRequestSchema = WorkTemplateUpdateSchema.openapi(
  "WorkTemplateUpdateRequest",
);

export const WorkOrderIncidentCreateRequestSchema = WorkOrderIncidentCreateSchema.openapi(
  "WorkOrderIncidentCreateRequest",
);
export const WorkOrderIncidentParamsOpenApiSchema =
  WorkOrderIncidentParamsSchema.openapi("WorkOrderIncidentParams");
export const WorkOrderTaskInstantiateRequestSchema = WorkOrderTaskInstantiateSchema.openapi(
  "WorkOrderTaskInstantiateRequest",
);
export const WorkOrderTaskParamsOpenApiSchema =
  WorkOrderTaskParamsSchema.openapi("WorkOrderTaskParams");
export const WorkOrderTaskStatusUpdateRequestSchema = WorkOrderTaskStatusUpdateSchema.openapi(
  "WorkOrderTaskStatusUpdateRequest",
);

export function registerFsmSchemas(registry: OpenAPIRegistry): void {
  registry.register("CustomerListItem", CustomerListItemSchema);
  registry.register("CustomersListResponse", CustomersListResponseSchema);
  registry.register("CustomerLocation", CustomerLocationSchema);
  registry.register("WorkOrderStatus", WorkOrderStatusSchema);
  registry.register("WorkOrderPriority", WorkOrderPrioritySchema);
  registry.register("CustomerRecentWorkOrder", CustomerRecentWorkOrderSchema);
  registry.register("CustomerDetailResponse", CustomerDetailResponseSchema);
  registry.register("TechnicianListItem", TechnicianListItemSchema);
  registry.register("TechniciansListResponse", TechniciansListResponseSchema);
  registry.register("WorkOrderListItem", WorkOrderListItemSchema);
  registry.register("WorkOrdersListResponse", WorkOrdersListResponseSchema);
  registry.register("WorkOrderNote", WorkOrderNoteSchema);
  registry.register("WorkOrderLineItem", WorkOrderLineItemSchema);
  registry.register("WorkOrderDetailResponse", WorkOrderDetailResponseSchema);
  registry.register("TaskStatus", TaskStatusSchema);
  registry.register("CompletionReadiness", CompletionReadinessSchema);
  registry.register("WorkOrderIncident", WorkOrderIncidentSchema);
  registry.register("WorkOrderIncidentResponse", WorkOrderIncidentResponseSchema);
  registry.register("WorkOrderTask", WorkOrderTaskSchema);
  registry.register("WorkOrderTasksResponse", WorkOrderTasksResponseSchema);
  registry.register("WorkOrderTaskStatusUpdateResponse", WorkOrderTaskStatusUpdateResponseSchema);
  registry.register("WorkTemplateTask", WorkTemplateTaskSchema);
  registry.register("WorkTemplateSkillRequirement", WorkTemplateSkillRequirementSchema);
  registry.register("WorkTemplateListItem", WorkTemplateListItemSchema);
  registry.register("WorkTemplatesListResponse", WorkTemplatesListResponseSchema);
  registry.register("WorkTemplateDetail", WorkTemplateDetailSchema);
  registry.register("WorkTemplateResponse", WorkTemplateResponseSchema);

  registry.register("CustomersListQueryParams", CustomersListQueryParamsSchema);
  registry.register("CustomerIdParams", CustomerIdParamsOpenApiSchema);
  registry.register("TechniciansListQueryParams", TechniciansListQueryParamsSchema);
  registry.register("WorkOrdersListQueryParams", WorkOrdersListQueryParamsSchema);
  registry.register("WorkOrderIdParams", WorkOrderIdParamsOpenApiSchema);
  registry.register("WorkTemplatesListQueryParams", WorkTemplatesListQueryParamsSchema);
  registry.register("WorkTemplateIdParams", WorkTemplateIdParamsOpenApiSchema);
  registry.register("WorkTemplateCreateRequest", WorkTemplateCreateRequestSchema);
  registry.register("WorkTemplateUpdateRequest", WorkTemplateUpdateRequestSchema);
  registry.register("WorkOrderIncidentCreateRequest", WorkOrderIncidentCreateRequestSchema);
  registry.register("WorkOrderIncidentParams", WorkOrderIncidentParamsOpenApiSchema);
  registry.register("WorkOrderTaskInstantiateRequest", WorkOrderTaskInstantiateRequestSchema);
  registry.register("WorkOrderTaskParams", WorkOrderTaskParamsOpenApiSchema);
  registry.register("WorkOrderTaskStatusUpdateRequest", WorkOrderTaskStatusUpdateRequestSchema);
}
