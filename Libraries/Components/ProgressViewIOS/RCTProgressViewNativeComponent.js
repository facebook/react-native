/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {NativeComponent} from '../../Renderer/shims/ReactNative';
import type {ImageSource} from '../../Image/ImageSource';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type NativeProps = $ReadOnly<{|
  ...ViewProps,
  progressViewStyle?: ?('default' | 'bar'),
  progress?: ?number,
  progressTintColor?: ?ColorValue,
  trackTintColor?: ?ColorValue,
  progressImage?: ?ImageSource,
  trackImage?: ?ImageSource,
|}>;

type NativeProgressViewIOS = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTProgressView',
): any): NativeProgressViewIOS);
