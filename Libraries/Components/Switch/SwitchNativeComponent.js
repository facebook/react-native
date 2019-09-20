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

const Platform = require('../../Utilities/Platform');
const ReactNative = require('../../Renderer/shims/ReactNative');

const requireNativeComponent = require('../../ReactNative/requireNativeComponent');

import type {SwitchChangeEvent} from '../../Types/CoreEventTypes';
import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ViewProps} from '../View/ViewPropTypes';
import type {NativeOrDynamicColorType} from '../../Color/NativeOrDynamicColorType'; // TODO(macOS ISS#2323203)

type SwitchProps = $ReadOnly<{|
  ...ViewProps,
  disabled?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  thumbColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForFalse?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackColorForTrue?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  value?: ?boolean,
|}>;

// @see ReactSwitchManager.java
export type NativeAndroidProps = $ReadOnly<{|
  ...SwitchProps,

  enabled?: ?boolean,
  on?: ?boolean,
  thumbTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  trackTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
|}>;

// @see RCTSwitchManager.m
export type NativeIOSProps = $ReadOnly<{|
  ...SwitchProps,

  onTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  thumbTintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
  tintColor?: ?(string | NativeOrDynamicColorType), // TODO(macOS ISS#2323203)
|}>;

type SwitchNativeComponentType = Class<
  ReactNative.NativeComponent<
    $ReadOnly<{|
      ...NativeAndroidProps,
      ...NativeIOSProps,
    |}>,
  >,
>;

const SwitchNativeComponent: SwitchNativeComponentType =
  Platform.OS === 'android'
    ? (requireNativeComponent('AndroidSwitch'): any)
    : (requireNativeComponent('RCTSwitch'): any);

module.exports = SwitchNativeComponent;
