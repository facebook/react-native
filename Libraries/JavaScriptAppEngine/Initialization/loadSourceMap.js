/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule loadSourceMap
 */

'use strict';

var SourceMapConsumer = require('SourceMap').SourceMapConsumer;

var sourceMapInstance;

function loadSourceMap() {
  if (sourceMapInstance !== undefined) {
    return sourceMapInstance;
  }
  if (!global.RAW_SOURCE_MAP) {
    return null;
  }
  sourceMapInstance = new SourceMapConsumer(global.RAW_SOURCE_MAP);
  return sourceMapInstance;
}

module.exports = loadSourceMap;
