/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SourceMapsUtils
 * @flow
 */

'use strict';

var HMRClient = require('../../Utilities/HMRClient');
var Promise = require('Promise');
var NativeModules = require('NativeModules');
var SourceMapConsumer = require('SourceMap').SourceMapConsumer;
var SourceMapURL = require('./source-map-url');

var RCTSourceCode = NativeModules.SourceCode;
var RCTNetworking = NativeModules.Networking;

var SourceMapsUtils = {
  fetchMainSourceMap(): Promise {
    return SourceMapsUtils._getMainSourceMapURL().then(url =>
      SourceMapsUtils.fetchSourceMap(url)
    );
  },

  fetchSourceMap(sourceMappingURL: string): Promise {
    return fetch(sourceMappingURL)
      .then(response => response.text())
      .then(map => new SourceMapConsumer(map));
  },

  extractSourceMapURL(data: ({url?:string, text?:string, fullSourceMappingURL?:string})): ?string {
    const url = data.url;
    const text = data.text;
    const fullSourceMappingURL = data.fullSourceMappingURL;
    if (fullSourceMappingURL) {
      return fullSourceMappingURL;
    }
    var mapURL = SourceMapURL.getFrom(text);
    if (!mapURL) {
      return null;
    }
    if (!url) {
      return null;
    }
    var baseURLs = url.match(/(.+:\/\/.*?)\//);
    if (!baseURLs || baseURLs.length < 2) {
      return null;
    }
    return baseURLs[1] + mapURL;
  },

  _getMainSourceMapURL(): Promise {
    if (global.RAW_SOURCE_MAP) {
      return Promise.resolve(global.RAW_SOURCE_MAP);
    }

    if (!RCTSourceCode) {
      return Promise.reject(new Error('RCTSourceCode module is not available'));
    }

    if (!RCTNetworking) {
      // Used internally by fetch
      return Promise.reject(new Error('RCTNetworking module is not available'));
    }

    return RCTSourceCode.getScriptText()
      .then(SourceMapsUtils.extractSourceMapURL)
      .then((url) => {
        if (url === null) {
          return Promise.reject(new Error('No source map URL found. May be running from bundled file.'));
        }
        return Promise.resolve(url);
      });
  },
};

module.exports = SourceMapsUtils;
