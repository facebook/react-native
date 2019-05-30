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

import type {NativeComponent} from '../../Renderer/shims/ReactNative';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

const React = require('react');
const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

type NativeProps = $ReadOnly<{|
  +children: React.Node,
  /**
   * An ID which is used to associate this `InputAccessoryView` to
   * specified TextInput(s).
   */
  nativeID?: ?string,
  style?: ?ViewStyleProp,
  backgroundColor?: ?ColorValue,
|}>;

type NativeInputAccessoryView = Class<NativeComponent<NativeProps>>;

module.exports = ((requireNativeComponent(
  'RCTInputAccessoryView',
): any): NativeInputAccessoryView);
