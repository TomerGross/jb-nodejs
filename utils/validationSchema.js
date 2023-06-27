const Joi = require('joi');

// Validation schema for symbol parameter
const symbolSchema = Joi.string()
  .alphanum()
  .uppercase()
  .length(3)
  .strict()
  .required()
  .error((errors) => {
    errors.forEach((err) => {
      switch (err.code) {
        case 'string.alphanum':
          err.message = 'Symbol must contain alphanumeric characters only';
          break;
        case 'string.uppercase':
          err.message = 'Symbol must be in uppercase';
          break;
        case 'string.length':
          err.message = 'Symbol must be exactly 3 characters long';
          break;
        case 'any.required':
          err.message = 'Symbol is required';
          break;
        case 'string.valid':
          err.message = 'Invalid cryptocurrency symbol';
          break;
        default:
          break;
      }
    });
    return errors;
});

module.exports = symbolSchema;