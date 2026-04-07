# Company Enrichment API

**© 2026 Groundwork Labs LLC** — California Limited Liability Company

## Description
API for enriching company data - takes company domain, LinkedIn URL, or name and returns founding date, employee count, funding, social links.

## Quick Start
```bash
npm install
cp .env.example .env
npm start
```

## API Usage
```bash
POST /api/company/enrich
x-api-key: YOUR_KEY
Body: { "domain": "example.com" }
# or
Body: { "linkedin": "https://linkedin.com/company/example" }
# or
Body: { "name": "Example Inc" }
```

## Response
```json
{
  "name": "Acme Corp",
  "founded": 2015,
 "employees": "50-200",
 "funding": "Series A",
 "linkedin": "...",
 "twitter": "..."
}
```

## Plans
- Free: 100 requests/mo
- Basic: $9.99/mo - 1,000 requests
- Pro: $29.99/mo - 10,000 requests

---
© 2026 Groundwork Labs LLC
