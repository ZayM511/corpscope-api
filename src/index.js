require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const apiKeyAuth = require('./middleware/apiKeyAuth');
const termsAcceptance = require('./middleware/termsAcceptance');
const requestLogger = require('./middleware/requestLogger');
const { validate, schemas } = require('./middleware/validation');
const companyRoutes = require('./routes/company');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(requestLogger);

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

app.use((req, res, next) => {
  res.setHeader('X-Company', 'Groundwork Labs LLC');
  res.setHeader('X-Jurisdiction', 'California, USA');
  next();
});

app.use('/api', apiKeyAuth);
app.use('/api/company', termsAcceptance, validate(schemas.companyLookup, 'body'), companyRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok', company: 'Groundwork Labs LLC', timestamp: new Date().toISOString() }));
app.get('/legal', (req, res) => res.json({ company: 'Groundwork Labs LLC', jurisdiction: 'California, USA' }));
app.get('/', (req, res) => res.json({ service: 'Company Enrichment API', company: 'Groundwork Labs LLC', version: '1.0.0' }));

app.listen(PORT, () => console.log(`Company Enrichment API running on port ${PORT}`));
module.exports = app;
