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

import type {NativeComponent} from 'ReactNative';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

const React = require('React');
const DeprecatedColorPropType = require('DeprecatedColorPropType');
const requireNativeComponent = require('requireNativeComponent');

type NativeProps = $ReadOnly<{|
  +children: React.Node,
  /**
   * An ID which is used to associate this `InputAccessoryView` to
   * specified TextInput(s).
   */
  nativeID?: ?string,
  style?: ?ViewStyleProp,
  backgroundColor?: ?DeprecatedColorPropType,
|}>;

type NativeInputAccessoryView = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTInputAccessoryView',
): any): NativeInputAccessoryView);
