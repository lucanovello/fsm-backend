import {
  CustomerIdParamsSchema,
  CustomersListQuerySchema,
} from "../../modules/customers/dto/customers.dto.js";
import { TechniciansListQuerySchema } from "../../modules/technicians/dto/technicians.dto.js";
import {
  WorkOrderIdParamsSchema,
  WorkOrdersListQuerySchema,
} from "../../modules/work-orders/dto/workOrders.dto.js";
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

  registry.register("CustomersListQueryParams", CustomersListQueryParamsSchema);
  registry.register("CustomerIdParams", CustomerIdParamsOpenApiSchema);
  registry.register("TechniciansListQueryParams", TechniciansListQueryParamsSchema);
  registry.register("WorkOrdersListQueryParams", WorkOrdersListQueryParamsSchema);
  registry.register("WorkOrderIdParams", WorkOrderIdParamsOpenApiSchema);
}
