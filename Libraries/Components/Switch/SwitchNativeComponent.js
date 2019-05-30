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
import type {ViewProps} from '../View/ViewPropTypes';

type SwitchProps = $ReadOnly<{|
  ...ViewProps,
  disabled?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  thumbColor?: ?string,
  trackColorForFalse?: ?string,
  trackColorForTrue?: ?string,
  value?: ?boolean,
|}>;

// @see ReactSwitchManager.java
export type NativeAndroidProps = $ReadOnly<{|
  ...SwitchProps,

  enabled?: ?boolean,
  on?: ?boolean,
  thumbTintColor?: ?string,
  trackTintColor?: ?string,
|}>;

// @see RCTSwitchManager.m
export type NativeIOSProps = $ReadOnly<{|
  ...SwitchProps,

  onTintColor?: ?string,
  thumbTintColor?: ?string,
  tintColor?: ?string,
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
