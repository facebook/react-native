/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const Platform = require('Platform');
const ReactNative = require('ReactNative');

const requireNativeComponent = require('requireNativeComponent');

import type {SwitchChangeEvent} from 'CoreEventTypes';
import type {ViewProps} from 'ViewPropTypes';

// @see ReactSwitchManager.java
export type NativeAndroidProps = $ReadOnly<{|
  ...ViewProps,
  enabled?: ?boolean,
  on?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  thumbTintColor?: ?string,
  trackTintColor?: ?string,
|}>;

// @see RCTSwitchManager.m
export type NativeIOSProps = $ReadOnly<{|
  ...ViewProps,
  disabled?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  onTintColor?: ?string,
  thumbTintColor?: ?string,
  tintColor?: ?string,
  value?: ?boolean,
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
