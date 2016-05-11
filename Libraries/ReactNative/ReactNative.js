/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule ReactNative
 * @flow
 */
'use strict';

const ReactIsomorphic = require('ReactIsomorphic');
const ReactNativeImpl = require('ReactNativeImpl');
const warning = require('fbjs/lib/warning');

const ReactNative = { ...ReactNativeImpl };

const dedupe = {};

if (__DEV__) {
  for (const key in ReactNativeImpl) {
    Object.defineProperty(ReactNative, key, {
      get: function() {
        return ReactNativeImpl[key];
      },
      set: function(value) {
        // Useful for hacky solutions like createExamplePage.
        ReactNativeImpl[key] = value;
      },
    });
  }
}

for (const key in ReactIsomorphic) {
  ReactNative[key] = ReactIsomorphic[key];
  if (__DEV__) {
    Object.defineProperty(ReactNative, key, {
      get: function() {
        warning(
          dedupe[key],
          'ReactNative.' + key + ' is deprecated. Use React.' + key +
          ' from the "react" package instead.'
        );
        dedupe[key] = true;
        return ReactIsomorphic[key];
      },
      set: function(value) {
        // Useful for hacky solutions like createExamplePage.
        ReactIsomorphic[key] = value;
      },
    });
  }
}

module.exports = ReactNative;
