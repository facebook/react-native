/**
 * Copyright (c) 2016-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

require('../../../../babelRegisterOnly')([
  /packager\/react-packager\/src\/lib\/TransformCache/,
]);

const TransformCache = require('../../lib/TransformCache');

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

function transformCode(transform, filename, sourceCode, options, transformCacheKey, callback) {
  const params = makeTransformParams(filename, sourceCode, options.transform);
  const isJson = filename.endsWith('.json');

  const transformFileStartLogEntry = {
    action_name: 'Transforming file',
    action_phase: 'start',
    file_name: filename,
    log_entry_label: 'Transforming file',
    start_timestamp: process.hrtime(),
  };

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

    const timeDelta = process.hrtime(transformFileStartLogEntry.start_timestamp);
    const duration_ms = Math.round((timeDelta[0] * 1e9 + timeDelta[1]) / 1e6);
    const transformFileEndLogEntry = {
      action_name: 'Transforming file',
      action_phase: 'end',
      file_name: filename,
      duration_ms: duration_ms,
      log_entry_label: 'Transforming file',
    };

    result.code = code;
    result.map = map;

    TransformCache.writeSync({
      filePath: filename,
      sourceCode,
      transformCacheKey,
      transformOptions: options,
      result,
    });
    return callback(null, {
      transformFileStartLogEntry,
      transformFileEndLogEntry,
    });
  });
}

exports.transformAndExtractDependencies = (
  transform,
  filename,
  sourceCode,
  options,
  transformCacheKey,
  callback
) => {
  transformCode(require(transform), filename, sourceCode, options || {}, transformCacheKey, callback);
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
