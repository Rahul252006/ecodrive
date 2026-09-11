function errorMiddleware(err, req, res, next) {
  console.error(`[Error] ${err.code || 'SERVER_ERROR'}: ${err.message}`);
  
  const status = err.status || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'An unexpected error occurred on the server.';

  res.status(status).json({
    success: false,
    error: {
      code,
      message
    }
  });
}

module.exports = errorMiddleware;
