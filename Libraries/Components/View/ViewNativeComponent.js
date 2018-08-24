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

const AndroidConfig = require('ViewNativeComponentAndroidConfig');
const Platform = require('Platform');
const ReactNative = require('ReactNative');

const verifyComponentAttributeEquivalence = require('verifyComponentAttributeEquivalence');
const requireNativeComponent = require('requireNativeComponent');
const ReactNativeViewConfigRegistry = require('ReactNativeViewConfigRegistry');

import type {ViewProps} from 'ViewPropTypes';

type ViewNativeComponentType = Class<ReactNative.NativeComponent<ViewProps>>;

let NativeViewComponent;
if (Platform.OS === 'android') {
  if (__DEV__) {
    verifyComponentAttributeEquivalence('RCTView', AndroidConfig);
  }

  NativeViewComponent = ReactNativeViewConfigRegistry.register('RCTView', () =>
    require('ViewNativeComponentAndroidConfig'),
  );
} else {
  NativeViewComponent = requireNativeComponent('RCTView');
}

module.exports = ((NativeViewComponent: any): ViewNativeComponentType);
