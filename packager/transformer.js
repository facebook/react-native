/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * Note: This is a fork of the fb-specific transform.js
 */
'use strict';

var jstransform = require('jstransform/simple').transform;

function transform(srcTxt, filename) {
  var options = {
    es3: true,
    harmony: true,
    react: true,
    stripTypes: true,
    utility: true,
    nonStrictEs6module: true,
    sourceFilename: filename,
    sourceMap: true
  };

  return jstransform(srcTxt, options);
}

module.exports = function(data, callback) {
  var result;
  try {
    result = transform(
      data.sourceCode,
      data.filename
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

// export for use in jest
module.exports.transform = transform;
