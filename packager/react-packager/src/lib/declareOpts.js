/**
 * Declares, validates and defaults options.
 * var validate = declareOpts({
 *   foo: {
 *     type: 'bool',
 *     required: true,
 *   }
 * });
 *
 * var myOptions = validate(someOptions);
 */

'use strict';

var Joi = require('joi');

module.exports = function(descriptor) {
  var joiKeys = {};
  Object.keys(descriptor).forEach(function(prop) {
    var record = descriptor[prop];
    if (record.type == null) {
      throw new Error('Type is required');
    }

    if (record.type === 'function') {
      record.type = 'func';
    }

    var propValidator = Joi[record.type]();

    if (record.required) {
      propValidator = propValidator.required();
    }

    if (record.default) {
      propValidator = propValidator.default(record.default);
    }

    joiKeys[prop] = propValidator;
  });

  var schema = Joi.object().keys(joiKeys);

  return function(opts) {
    var res = Joi.validate(opts, schema, {
      abortEarly: true,
      allowUnknown: false,
    });

    if (res.error) {
      throw new Error('Error validating module options: ' + res.error.message);
    }
    return res.value;
  };
};
