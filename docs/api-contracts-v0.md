### GET /api/customers

**Query params**

-

**Response 200**

```jsonc
{}
```

---

### GET /api/customers/:id

**Query params**

-

**Response 200**

```jsonc
{}
```

---

### GET /api/technicians

**Query params**

-

**Response 200**

```jsonc
{}
```

---

### GET /api/work-orders

**Query params**

- `date` (optional, ISO date) – filter by scheduled date
- `status` (optional) – one of WorkOrderStatus
- `technicianId` (optional)

**Response 200**

```jsonc
{
  "items": [
    {
      "id": "wo_123",
      "summary": "Spring cleanup & inspection",
      "status": "SCHEDULED",
      "priority": "HIGH",
      "scheduledStart": "2025-04-12T09:00:00Z",
      "scheduledEnd": "2025-04-12T11:00:00Z",
      "customer": {
        "id": "cust_1",
        "name": "Acme Corp"
      },
      "location": {
        "id": "loc_1",
        "label": "Head Office",
        "city": "Toronto"
      },
      "assignedTechnician": {
        "id": "tech_1",
        "displayName": "Alex Tech"
      }
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 2
}
```

---

### GET /api/work-orders/:id

**Query params**

-

**Response 200**

```jsonc
{}
```

---
