const requestLogger = (req, res, next) => {
  const start = Date.now();
  const requestId = Math.random().toString(36).substring(7);
  req.requestId = requestId;
  console.log(`[${requestId}] ${req.method} ${req.path} - Started`);
  res.on('finish', () => console.log(`[${requestId}] ${req.method} ${req.path} - ${res.statusCode} (${Date.now() - start}ms)`));
  next();
};
module.exports = requestLogger;
