# Achievers-iSchool-Locator-Portal

# International School Data Schema – README

This document defines the standard JSON structure used to store and manage
Hong Kong **International / Private School** data for internal tools such as
the iSchool Locator, admissions consultancy systems, and school comparison
features.

---

## 1. Data Structure Overview

Each school is represented as an object inside a JSON array.

```json
[
  { "school": "object" }
]
```

---

## 2. Field Definitions

### 2.1 Basic Information

| Field | Type | Description |
|------|------|-------------|
| name | string | Official English school name |
| chineseName | string | Official Chinese school name |
| abbreviation | string | School short name (e.g. CIS, DBIS) |
| category | string | Always use `Private / International` |

---

### 2.2 Location Object

```json
"location": {
  "address": "",
  "lat": 0,
  "lng": 0
}
```

| Field | Type | Description |
|------|------|-------------|
| address | string | Full school address |
| lat | number | Latitude (Google Maps compatible) |
| lng | number | Longitude (Google Maps compatible) |

---

### 2.3 Tier Classification

```json
"tier": {
  "secondary": "Top",
  "rankIndex": 1
}
```

Allowed values for `tier.secondary`:
- Top
- Middle
- Accessible
- Transition

| Field | Type | Description |
|------|------|-------------|
| secondary | string | Overall competitiveness (secondary level) |
| rankIndex | number | Lower = more competitive (1 = Top) |

---

### 2.4 Curriculum

```json
"curriculum": {
  "secondary": ["IGCSE", "IBDP"],
  "pathway": ["IGCSE-IBDP"]
}
```

Allowed values for `curriculum.secondary`:
- IGCSE
- HKDSE
- A-Level
- IBDP
- AP
- SAT
- Others

Allowed values for `curriculum.pathway`:
- IGCSE-IBDP
- IGCSE-A Level
- DSE-IBDP
- A-Level-IBDP
- AP-SAT
- Others

---

### 2.5 School Stages

```json
"stages": {
  "kindergarten": true,
  "primary": true,
  "secondary": true
}
```

| Field | Description |
|------|-------------|
| kindergarten | K1–K3 |
| primary | P1–P6 / Y1–Y6 |
| secondary | Y7–Y13 |

---

## 3. Full JSON Template

```json
[
  {
    "_comment": "Template for International School Data Schema",

    "name": "",
    "chineseName": "",
    "abbreviation": "",
    "category": "Private / International",

    "location": {
      "address": "",
      "lat": 0,
      "lng": 0
    },

    "tier": {
      "secondary": "Top",
      "rankIndex": 1
    },

    "curriculum": {
      "secondary": ["IGCSE", "IBDP"],
      "pathway": [
        "IGCSE-IBDP",
        "IGCSE-A Level",
        "DSE-IBDP",
        "A-Level-IBDP",
        "AP-SAT",
        "Others"
      ]
    },

    "stages": {
      "kindergarten": true,
      "primary": true,
      "secondary": true
    }
  }
]
```

---

## 4. Notes & Conventions

- `_comment` fields are for human readability only
- Remove `_comment` fields if strict JSON parsing is required
- Curriculum fields must always be arrays
- Latitude range: -90 to 90
- Longitude range: -180 to 180

---

## 5. Recommended Validation Rules

- name must not be empty in production data
- rankIndex must be an integer ≥ 1
- tier.secondary must match allowed values exactly
- curriculum.secondary values must come from the approved list

---

## 6. Internal Usage Reference

- Admissions team: school competitiveness & pathway reference
- Consultants: stage suitability and positioning
- Developers: filtering, ranking, map-distance calculations
