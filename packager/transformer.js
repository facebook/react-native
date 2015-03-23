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

var jstransform = require('jstransform').transform;

var reactVisitors =
  require('react-tools/vendor/fbtransform/visitors').getAllVisitors();
var staticTypeSyntax =
  require('jstransform/visitors/type-syntax').visitorList;
// Note that reactVisitors now handles ES6 classes, rest parameters, arrow
// functions, template strings, and object short notation.
var visitorList = reactVisitors;


function transform(srcTxt, filename) {
  var options = {
    es3: true,
    sourceType: 'nonStrictModule',
    filename: filename,
  };

  // These tranforms mostly just erase type annotations and static typing
  // related statements, but they were conflicting with other tranforms.
  // Running them first solves that problem
  var staticTypeSyntaxResult = jstransform(
    staticTypeSyntax,
    srcTxt,
    options
  );

  return jstransform(
    visitorList,
    staticTypeSyntaxResult.code,
    options
  );
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
