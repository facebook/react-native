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
var makeInternalPreset = require('babel-preset-react-native/internal');

// Runs internal transforms on the given sourceCode. Note that internal
// transforms should be run after the external ones to ensure that they run on
// Javascript code
function internalTransforms(sourceCode, filename, options) {
  var internalPreset = makeInternalPreset(options);

  if (!internalPreset) {
    return {
      code: sourceCode,
      filename: filename,
    };
  }

  var presets = [ internalPreset ];

  var result = babel.transform(sourceCode, {
    filename: filename,
    sourceFileName: filename,
    presets: presets
  });

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
