/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule exceptionOccurHint
 */

'use strict';

const SourceMapsCache = require('SourceMapsCache');
const parseErrorStack = require('parseErrorStack');

function exceptionOccurHint() {
  const stack =  parseErrorStack(new Error());
  const renderFrame = stack.find((frame) => frame.methodName.endsWith('render'));

  if (renderFrame) {
    return SourceMapsCache.getSourceMaps().then(sourceMaps => {
      const prettyStack = parseErrorStack({stack: [renderFrame]}, sourceMaps);
      const prettyFrame = prettyStack[0];
      const fileParts = prettyFrame.file.split('/');
      const fileName = fileParts[fileParts.length - 1];
      return `At: ${fileName }:${prettyFrame.lineNumber}`;
    });
  } else {
    return new Promise((resolve, reject) => resolve(null));
  }
}

module.exports = exceptionOccurHint;
