# Company Enrichment API

**© 2026 Groundwork Labs LLC** — A California Limited Liability Company

## About

**Groundwork Labs LLC** provides company data enrichment APIs for sales teams, recruiters, and investors.

## Quick Start
```bash
npm install
cp .env.example .env
npm start
```

## Company Information
- **Legal Entity:** Groundwork Labs LLC
- **Type:** Limited Liability Company
- **Jurisdiction:** California, USA
- **Website:** https://groundworklabs.com
- **Support:** support@groundworklabs.com

## API Usage
```bash
POST /api/company/enrich
x-api-key: YOUR_KEY
Body: { "domain": "example.com" }
```

## Response
```json
{
  "name": "Acme Corp",
  "founded": 2015,
  "employees": "50-200",
  "funding": "Series A",
  "linkedin": "https://linkedin.com/company/acme",
  "twitter": "https://twitter.com/acme"
}
```

## Plans
- **Free:** 100 requests/mo
- **Basic:** $9.99/mo - 1,000 requests
- **Pro:** $29.99/mo - 10,000 requests

## Legal
- [Terms of Service](legal/TermsOfService.md)
- [Privacy Policy](legal/PrivacyPolicy.md)

---
**Groundwork Labs LLC** — California Limited Liability Company
