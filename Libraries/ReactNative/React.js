/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule React
 * @flow
 */
'use strict';

const ReactIsomorphic = require('ReactIsomorphic');
const ReactNativeImpl = require('ReactNativeImpl');
const warning = require('fbjs/lib/warning');

const React = { ...ReactIsomorphic };

const dedupe = {};

for (const key in ReactNativeImpl) {
  React[key] = ReactNativeImpl[key];
  if (__DEV__) {
    Object.defineProperty(React, key, {
      get: function() {
        warning(
          dedupe[key],
          'React.' + key + ' is deprecated. Use ReactNative.' + key +
          ' from the "react-native" package instead.'
        );
        dedupe[key] = true;
        return ReactNativeImpl[key];
      },
      set: function(value) {
        // Useful for hacky solutions like createExamplePage.
        ReactNativeImpl[key] = value;
      },
    });
  }
}

module.exports = React;
