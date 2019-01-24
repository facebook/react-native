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

const requireNativeComponent = require('requireNativeComponent');

import type {ViewProps} from 'ViewPropTypes';
import type {ViewStyleProp} from 'StyleSheet';
import type {NativeComponent} from 'ReactNative';

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  /**
   * Whether the indicator should hide when not animating (true by default).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#hideswhenstopped
   */
  hidesWhenStopped?: ?boolean,

  /**
   * Whether to show the indicator (true, the default) or hide it (false).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#animating
   */
  animating?: ?boolean,

  /**
   * The foreground color of the spinner (default is gray).
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#color
   */
  color?: ?string,

  /**
   * Size of the indicator (default is 'small').
   * Passing a number to the size prop is only supported on Android.
   *
   * See http://facebook.github.io/react-native/docs/activityindicator.html#size
   */
  size?: ?(number | 'small' | 'large'),

  style?: ?ViewStyleProp,
  styleAttr?: ?string,
  indeterminate?: ?boolean,
|}>;

type ActivityIndicatorNativeType = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTActivityIndicatorView',
): any): ActivityIndicatorNativeType);
