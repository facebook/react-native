/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const ReactNative = require('../../Renderer/shims/ReactNative');
const Platform = require('../../Utilities/Platform');
const registerGeneratedViewConfig = require('../../Utilities/registerGeneratedViewConfig');
const ReactNativeViewViewConfigAndroid = require('./ReactNativeViewViewConfigAndroid');
const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {ViewProps} from './ViewPropTypes';

type ViewNativeComponentType = Class<ReactNative.NativeComponent<ViewProps>>;

let NativeViewComponent;
let viewConfig;

// Only use the JS view config in DEV
if (__DEV__) {
  // On Android, View extends the base component with additional view-only props
  // On iOS, the base component is View
  if (Platform.OS === 'android') {
    viewConfig = ReactNativeViewViewConfigAndroid;
    registerGeneratedViewConfig('RCTView', ReactNativeViewViewConfigAndroid);
  } else {
    viewConfig = {};
    registerGeneratedViewConfig('RCTView', {uiViewClassName: 'RCTView'});
  }

  NativeViewComponent = 'RCTView';
} else {
  NativeViewComponent = requireNativeComponent('RCTView');
}

export const __INTERNAL_VIEW_CONFIG = viewConfig;
export default ((NativeViewComponent: any): ViewNativeComponentType);
