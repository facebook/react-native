/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule loadSourceMap
 * @flow
 */

'use strict';

var Promise = require('Promise');
var RCTSourceCode = require('NativeModules').SourceCode;
var SourceMapConsumer = require('SourceMap').SourceMapConsumer;
var SourceMapURL = require('./source-map-url');

var fetch = require('fetch');

function loadSourceMap(): Promise {
  return fetchSourceMap()
    .then(map => new SourceMapConsumer(map));
}

function fetchSourceMap(): Promise {
  if (global.RAW_SOURCE_MAP) {
    return Promise.resolve(global.RAW_SOURCE_MAP);
  }

  if (!RCTSourceCode) {
    return Promise.reject(new Error('RCTSourceCode module is not available'));
  }

  return new Promise(RCTSourceCode.getScriptText)
    .then(extractSourceMapURL)
    .then(fetch)
    .then(response => response.text())
}

function extractSourceMapURL({url, text}): string {
  var mapURL = SourceMapURL.getFrom(text);
  var baseURL = url.match(/(.+:\/\/.*?)\//)[1];
  return baseURL + mapURL;
}

module.exports = loadSourceMap;
