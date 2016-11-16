/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Declares, validates and defaults options.
 * var validate = declareOpts({
 *   foo: {
 *     type: 'bool',
 *     required: true,
 *   }
 * });
 *
 * var myOptions = validate(someOptions);
 *
 * @flow
 */

'use strict';

var Joi = require('joi');

/**
 * TOut is always more specific than TIn, so it's a subtype.
 */
module.exports = function<TIn: {}, TOut: TIn>(
  descriptor: {[name: string]: {
    type: mixed,
    required?: boolean,
    default?: mixed,
  }},
): (untyped: TIn) => TOut {
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
    opts = opts || {};

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
