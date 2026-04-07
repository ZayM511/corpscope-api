const Joi = require('joi');

const schemas = {
  companyLookup: Joi.object({
    domain: Joi.string().domain().optional(),
    linkedin: Joi.string().uri().optional(),
    name: Joi.string().min(2).max(100).optional()
  }).or('domain', 'linkedin', 'name').required()
};

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property]);
    if (error) return res.status(400).json({ error: 'Validation failed', details: error.details });
    req.validated = value;
    next();
  };
};
module.exports = { schemas, validate };
