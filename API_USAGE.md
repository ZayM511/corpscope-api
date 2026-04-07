# Company Enrichment API Usage

## Base URL
`http://localhost:3000` (local) or your deployed URL

## Authentication
```bash
x-api-key: YOUR_API_KEY
```

## Endpoints

### Enrich Company Data
```bash
POST /api/company/enrich
```

**Request:**
```json
{ "domain": "example.com" }
# or
{ "linkedin": "https://linkedin.com/company/example" }
# or
{ "name": "Example Inc" }
```

**Response:**
```json
{
  "success": true,
  "data": {
    "name": "Acme Corp",
    "founded": 2015,
    "employees": "50-200",
    "funding": "Series A",
    "linkedin": "https://linkedin.com/...",
    "twitter": "https://twitter.com/..."
  }
}
```

### Test Keys
- `sk_test_free_001` - Free tier
- `sk_test_basic_002` - Basic tier
- `sk_test_pro_003` - Pro tier

---
© 2026 Groundwork Labs LLC
