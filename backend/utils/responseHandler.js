// Utility functions for standard responses
exports.sendSuccess = (res, data, message = 'Success', code = 200) => {
  return res.status(code).json({ status: 'success', message, data });
};

exports.sendError = (res, error, defaultMessage = 'Internal Server Error') => {
  return res.status(error.statusCode || 500).json({
    status: 'error',
    message: error.message || defaultMessage
  });
};
