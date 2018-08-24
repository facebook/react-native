/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const AndroidConfig = require('ImageViewNativeComponentAndroidConfig');
const Platform = require('Platform');

const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');
const requireNativeComponent = require('requireNativeComponent');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

let ImageViewNativeComponent;
if (Platform.OS === 'android') {
  if (__DEV__) {
    verifyComponentAttributeEquivalence('RCTImageView', AndroidConfig);
  }

  ImageViewNativeComponent = ReactNativeViewConfigRegistry.register(
    'RCTImageView',
    () => AndroidConfig,
  );
} else {
  ImageViewNativeComponent = requireNativeComponent('RCTImageView');
}

module.exports = ImageViewNativeComponent;
