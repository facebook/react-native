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

const Platform = require('Platform');
const ReactNative = require('ReactNative');

const requireNativeComponent = require('requireNativeComponent');

import type {SwitchChangeEvent} from 'CoreEventTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {SemanticOrDynamicColorType} from 'normalizeColor'; // TODO(macOS ISS#2323203)

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
<<<<<<< HEAD
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  thumbTintColor?: ?(string | SemanticOrDynamicColorType),
  trackTintColor?: ?(string | SemanticOrDynamicColorType),
=======
  thumbTintColor?: ?string,
  trackTintColor?: ?string,
>>>>>>> v0.59.0
|}>;

// @see RCTSwitchManager.m
export type NativeIOSProps = $ReadOnly<{|
<<<<<<< HEAD
  ...ViewProps,
  disabled?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
  onTintColor?: ?(string | SemanticOrDynamicColorType),
  thumbTintColor?: ?(string | SemanticOrDynamicColorType),
  tintColor?: ?(string | SemanticOrDynamicColorType),
  value?: ?boolean,
=======
  ...SwitchProps,

  onTintColor?: ?string,
  thumbTintColor?: ?string,
  tintColor?: ?string,
>>>>>>> v0.59.0
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
