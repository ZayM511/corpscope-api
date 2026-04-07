const express = require('express');
const router = express.Router();
const { enrichCompany } = require('../scrapers/company');

router.post('/enrich', async (req, res) => {
  try {
    const data = req.validated || req.body;
    const result = await enrichCompany(data);
    res.json({ success: true, data: result, requestId: req.requestId });
  } catch (error) {
    res.status(500).json({ error: error.message, requestId: req.requestId });
  }
});

module.exports = router;
