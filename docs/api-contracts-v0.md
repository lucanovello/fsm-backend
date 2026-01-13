### GET /api/customers

**Query params**

- `q` (optional) search across name, email, phone
- `page` (optional, default: 1)
- `pageSize` (optional, default: 25, max: 100)

**Response 200**

```jsonc
{
  "items": [
    {
      "id": "cust_1",
      "name": "Acme Corp",
      "email": "ops@acme.example",
      "phone": "+1-555-0100"
    }
  ],
  "page": 1,
  "pageSize": 25,
  "total": 42
}
```

---

### GET /api/customers/:id

**Query params**

-

**Response 200**

```jsonc
{
  "customer": {
    "id": "cust_1",
    "name": "Acme Corp",
    "email": "ops@acme.example",
    "phone": "+1-555-0100"
  },
  "locations": [
    {
      "id": "loc_1",
      "label": "Head Office",
      "addressLine1": "100 King St W",
      "addressLine2": "Suite 1200",
      "city": "Toronto",
      "province": "ON",
      "postalCode": "M5X 1A9",
      "country": "CA",
      "latitude": 43.6487,
      "longitude": -79.3854
    }
  ],
  "recentWorkOrders": [
    {
      "id": "wo_123",
      "summary": "Spring cleanup & inspection",
      "status": "SCHEDULED",
      "priority": "HIGH",
      "scheduledStart": "2025-04-12T09:00:00Z",
      "scheduledEnd": "2025-04-12T11:00:00Z",
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
  ]
}
```

---

### GET /api/technicians

**Query params**

-

**Response 200**

```jsonc
{
  "items": [
    {
      "id": "tech_1",
      "displayName": "Alex Tech",
      "email": "alex.tech@example.com",
      "phone": "+1-555-0111"
    }
  ],
  "page": 1,
  "pageSize": 100,
  "total": 2
}
```

---

### GET /api/work-orders

**Query params**

- `date` (optional, ISO date) filter by scheduled date
- `status` (optional) one of WorkOrderStatus or a comma-separated list
- `technicianId` (optional)
- `page` (optional, default: 1)
- `pageSize` (optional, default: 25, max: 100)

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
{
  "id": "wo_123",
  "summary": "Spring cleanup & inspection",
  "description": "Quarterly HVAC inspection and filter replacement.",
  "status": "SCHEDULED",
  "priority": "HIGH",
  "scheduledStart": "2025-04-12T09:00:00Z",
  "scheduledEnd": "2025-04-12T11:00:00Z",
  "actualStart": null,
  "actualEnd": null,
  "customer": {
    "id": "cust_1",
    "name": "Acme Corp"
  },
  "location": {
    "id": "loc_1",
    "label": "Head Office",
    "addressLine1": "100 King St W",
    "addressLine2": "Suite 1200",
    "city": "Toronto",
    "province": "ON",
    "postalCode": "M5X 1A9",
    "country": "CA"
  },
  "assignedTechnician": {
    "id": "tech_1",
    "displayName": "Alex Tech"
  },
  "notes": [
    {
      "id": "note_1",
      "author": {
        "id": "user_1",
        "email": "alex.tech@example.com"
      },
      "body": "Arrived on-site, starting inspection.",
      "createdAt": "2025-04-12T09:05:00Z"
    }
  ],
  "lineItems": [
    {
      "id": "li_1",
      "description": "HVAC filter replacement",
      "quantity": 2,
      "unitPriceCents": 1299
    }
  ]
}
```

---
