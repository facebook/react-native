/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */
'use strict';

var babel = require('babel-core');
var makeInternalConfig = require('babel-preset-react-native/configs/internal');

// Runs internal transforms on the given sourceCode. Note that internal
// transforms should be run after the external ones to ensure that they run on
// Javascript code
function internalTransforms(sourceCode, filename, options) {
  var internalBabelConfig = makeInternalConfig(options);

  if (!internalBabelConfig) {
    return {
      code: sourceCode,
      filename: filename,
    };
  }

  var result = babel.transform(sourceCode, Object.assign({
    filename: filename,
    sourceFileName: filename,
  }, internalBabelConfig));

  return {
    code: result.code,
    filename: filename,
  };
}

function onExternalTransformDone(data, callback, error, externalOutput) {
  if (error) {
    callback(error);
    return;
  }

  var result = internalTransforms(
    externalOutput.code,
    externalOutput.filename,
    data.options
  );

  callback(null, result);
}

module.exports = function(data, callback) {
  try {
    if (data.options.externalTransformModulePath) {
      var externalTransformModule = require(
        data.options.externalTransformModulePath
      );
      externalTransformModule(
        data,
        onExternalTransformDone.bind(null, data, callback)
      );
    } else {
      onExternalTransformDone(
        data,
        callback,
        null,
        {
          code: data.sourceCode,
          filename: data.filename
        }
      );
    }
  } catch (e) {
    callback(e);
  }
};
