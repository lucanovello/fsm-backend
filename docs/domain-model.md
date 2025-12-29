# Domain Model – First Pass

## Core Entities

### **Customer**
  - `id`, `name`, `email`, `phone`, `billing address fields`...
  - **Relationships:**
    - has many `ServiceLocations`
    - has many `WorkOrders`

### **ServiceLocation**
  - `id`, `customerId`, `label`, `address fields`, `latitude`/`longitude`...
  - **Relationships:**
    - belongs to `Customer`
    - has many `WorkOrders`

### **Technician**
  - `id`, `userId`, `displayName`, `phone`...
  - **Relationships:**
    - belongs to `User`
    - has many `WorkOrders` (assigned)

### **WorkOrder**
  - `id`, `customerId`, `locationId`, `assignedTechnicianId`
  - status: `DRAFT` | `SCHEDULED` | `IN_PROGRESS` | `COMPLETED` | `CANCELLED`
  - priority: `LOW` | `NORMAL` | `HIGH` | `URGENT`
  - `summary`, `description`
  - `scheduledStart`, `scheduledEnd`, `actualStart`, `actualEnd`
  - **Relationships:**
    - belongs to `Customer`
    - belongs to `ServiceLocation`
    - optionally belongs to `Technician`
    - has many `WorkNotes`

### **WorkNote**
  - `id`, `workOrderId`, `authorUserId`, `body`, `createdAt`
  - **Relationships:**
    - belongs to `WorkOrder`
    - belongs to `User`
