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

const requireNativeComponent = require('requireNativeComponent');

import type {NativeComponent} from 'ReactNative';
import type {ImageSource} from 'ImageSource';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

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
