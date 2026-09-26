export function errorHandler(err, req, res, next) {
  const status = err.status ?? 500;

  if (status === 500) {
    req.log?.error({ err }, err.message);
  }

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error." : err.message,
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
