/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

const constantFolding = require('./constant-folding');
const extractDependencies = require('./extract-dependencies');
const inline = require('./inline');
const minify = require('./minify');

function makeTransformParams(filename, sourceCode, options) {
  if (filename.endsWith('.json')) {
    sourceCode = 'module.exports=' + sourceCode;
  }
  return {filename, sourceCode, options};
}

function transformCode(transform, filename, sourceCode, options, callback) {
  const params = makeTransformParams(filename, sourceCode, options.transform);
  const isJson = filename.endsWith('.json');

  transform(params, (error, transformed) => {
    if (error) {
      callback(error);
      return;
    }

    var code, map;
    if (options.minify) {
      const optimized =
        constantFolding(filename, inline(filename, transformed, options));
      code = optimized.code;
      map = optimized.map;
    } else {
      code = transformed.code;
      map = transformed.map;
    }

    if (isJson) {
      code = code.replace(/^\w+\.exports=/, '');
    } else {
      // Remove shebang
      code = code.replace(/^#!.*/, '');
    }

    const result = isJson || options.extern
      ? {dependencies: [], dependencyOffsets: []}
      : extractDependencies(code);

    result.code = code;
    result.map = map;

    callback(null, result);
  });
}

exports.transformAndExtractDependencies = (
  transform,
  filename,
  sourceCode,
  options,
  callback
) => {
  transformCode(require(transform), filename, sourceCode, options || {}, callback);
};

exports.minify = (filename, code, sourceMap, callback) => {
  var result;
  try {
    result = minify(filename, code, sourceMap);
  } catch (error) {
    callback(error);
  }
  callback(null, result);
};

exports.transformCode = transformCode; // for easier testing
