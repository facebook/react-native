/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SourceMapsCache
 */
'use strict';

const getObjectValues = require('getObjectValues');
const SourceMapsUtils = require('SourceMapsUtils');

const sourceMapsCache = {};

const SourceMapsCache = {
  mainSourceMapID: 'main',

  fetch({text, url, fullSourceMappingURL}) {
    const sourceMappingURL = fullSourceMappingURL
      ? fullSourceMappingURL
      : SourceMapsUtils.extractSourceMapURL({text, url});

    sourceMapsCache[sourceMappingURL] = SourceMapsUtils.fetchSourceMap(
      sourceMappingURL
    );
  },

  getSourceMaps() {
    fetchMainSourceMap();
    return Promise.all(getObjectValues(sourceMapsCache));
  },
};

function fetchMainSourceMap() {
  if (!sourceMapsCache[SourceMapsCache.mainSourceMapID]) {
    sourceMapsCache[SourceMapsCache.mainSourceMapID] =
      SourceMapsUtils.fetchMainSourceMap();
  }
}

module.exports = SourceMapsCache;
