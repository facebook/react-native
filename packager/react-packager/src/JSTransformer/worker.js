/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var transformer = require('./transformer');

module.exports = function (data, callback) {
  var result;
  try {
    result = transformer.transform(
      data.transformSets,
      data.sourceCode,
      data.options
    );
  } catch (e) {
    return callback(null, {
      error: {
        lineNumber: e.lineNumber,
        column: e.column,
        message: e.message,
        stack: e.stack,
        description: e.description
      }
    });
  }

  callback(null, result);
};
