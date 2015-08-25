/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule checkFlowAtRuntime
 *
 */
'use strict';

function checkFlowAtRuntime() {
  var url = getPackagerURL();
  if (!url) {
    return;
  }
  fetch(url + 'flow/')
    .then(response => response.json())
    .then(response => {
      if (response.silentError) {
        return;
      }
      throw {
        message: response.message,
        stack: response.errors.map(err => {
          return {
            ...err,
            methodName: err.description,
            file: err.filename,
          };
        }),
      };
    },
    () => {
    //if fetch fails, silently give up
    })
    .done();
}

function getPackagerURL() {
  var NativeModules = require('NativeModules');
  var scriptURL = (NativeModules
    && NativeModules.SourceCode
    && NativeModules.SourceCode.scriptURL)
    || '';

  // extract the url of the packager from the whole scriptURL
  // we match until the first / after http(s)://
  // i.e. http://www.mypackger.com/debug/my/bundle -> http://www.mypackger.com/
  return getFirstOrNull(scriptURL.match(/^https?:\/\/[^/]+\//));
}

function getFirstOrNull(ar) {
  return ar ? ar[0] : null;
}

module.exports = checkFlowAtRuntime;
