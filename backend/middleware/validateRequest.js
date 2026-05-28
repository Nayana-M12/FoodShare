function requireBodyFields(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => {
      const value = req.body[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required fields: ${missingFields.join(', ')}`,
      });
    }

    next();
  };
}

function requireValidValue(fieldName, allowedValues) {
  return (req, res, next) => {
    const value = String(req.body[fieldName] || '').toLowerCase();

    if (!allowedValues.includes(value)) {
      return res.status(400).json({
        success: false,
        message: `${fieldName} must be one of: ${allowedValues.join(', ')}`,
      });
    }

    next();
  };
}

module.exports = {
  requireBodyFields,
  requireValidValue,
};
