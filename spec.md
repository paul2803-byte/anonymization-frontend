** Frontend for Anonymization Endpoint **

## Overview

The frontend should add a nice minimalistic UI to the anonymization endpoint.
The underlying service has two endpoints:
- https://anonymizer.go-data.at/api/anonymization
- https://anonymizer.go-data.at/api/anonymization/flatjson

The first endpoint is used for the anonymization of JSON-LD, the second one is used for flat JSON.

API Documentation: https://anonymizer.go-data.at/swagger-ui/index.html#/

---

## API Specification

### 1. Anonymization of JSON-LD Data

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/anonymization` |
| **Method** | `PUT` |
| **Content-Type** | `application/json`, `application/ld+json` |

#### Request Body Schema (`AnonymizationJsonLDRequestDto`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `configurationUrl` | string | ✅ Yes | The URL of the anonymization configuration |
| `data` | object | ✅ Yes | The JSON-LD data to be anonymized (typically contains `@context` and `@graph`) |
| `calculateKpi` | boolean | ❌ No | If `true`, KPIs will be calculated and included in the response. Default: `true` |
| `includeOriginalData` | boolean | ❌ No | If `true`, the original input data is included in the response. Default: `false` |

#### Responses

| Status Code | Description |
|-------------|-------------|
| `202 Accepted` | The request was successful and data is being processed/returned |
| `400 Error` | The request was malformed or validation failed |

---

### 2. Anonymization of Flat JSON Data

| Property | Value |
|----------|-------|
| **Endpoint** | `/api/anonymization/flatjson` |
| **Method** | `PUT` |
| **Content-Type** | `application/json` |

#### Request Body Schema (`AnonymizationFlatJsonRequestDto`)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `configurationUrl` | string | ✅ Yes | The URL of the anonymization configuration |
| `prefix` | string | ✅ Yes | The prefix to identify the properties to be anonymized in the flat JSON |
| `data` | array | ✅ Yes | An array of flat JSON objects to be anonymized |
| `calculateKpi` | boolean | ❌ No | If `true`, KPIs will be calculated. Default: `true` |
| `includeOriginalData` | boolean | ❌ No | If `true`, original data is included. Default: `false` |

#### Responses

| Status Code | Description |
|-------------|-------------|
| `202 Accepted` | Success |
| `400 Error` | Error |

---

## UI Requirements

The UI should be minimalistic and easy to use.

### Core Features
- File input field for uploading JSON data
- Button to start the anonymization
- Clear separation between the two endpoints (JSON-LD vs. Flat JSON)

### File Upload Requirements
- **Accepted file format**: JSON files only (`.json` extension)
- Both endpoints (JSON-LD and Flat JSON) require the uploaded file to be a valid JSON file

### Output Display Requirements
- **Output format**: The anonymization result should be displayed as text directly in the UI
- **No download**: The output should NOT be offered as a file download
- The result should be presented in a readable text format (e.g., formatted JSON in a text area or code block)

### Input Fields per Endpoint

#### JSON-LD Endpoint
- Configuration URL input (text field)
- JSON-LD data input (file upload or text area)
- Calculate KPI toggle (optional, default: true)
- Include Original Data toggle (optional, default: false)

#### Flat JSON Endpoint
- Configuration URL input (text field)
- Prefix input (text field)
- Flat JSON data input (file upload or text area)
- Calculate KPI toggle (optional, default: true)
- Include Original Data toggle (optional, default: false)

---

## Tech Stack

- Angular

