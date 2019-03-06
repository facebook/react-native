/**
<<<<<<< HEAD
 * Copyright (c) 2013-present, Facebook, Inc.
=======
 * Copyright (c) Facebook, Inc. and its affiliates.
>>>>>>> v0.58.6
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
<<<<<<< HEAD
import type {SemanticOrDynamicColorType} from 'normalizeColor' // TODO(macOS ISS#2323203)
=======
>>>>>>> v0.58.6

// @see ReactSwitchManager.java
export type NativeAndroidProps = $ReadOnly<{|
  ...ViewProps,
  enabled?: ?boolean,
  on?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
<<<<<<< HEAD
  thumbTintColor?: ?(string | SemanticOrDynamicColorType),
  trackTintColor?: ?(string | SemanticOrDynamicColorType),
=======
  thumbTintColor?: ?string,
  trackTintColor?: ?string,
>>>>>>> v0.58.6
|}>;

// @see RCTSwitchManager.m
export type NativeIOSProps = $ReadOnly<{|
  ...ViewProps,
  disabled?: ?boolean,
  onChange?: ?(event: SwitchChangeEvent) => mixed,
<<<<<<< HEAD
  onTintColor?: ?(string | SemanticOrDynamicColorType),
  thumbTintColor?: ?(string | SemanticOrDynamicColorType),
  tintColor?: ?(string | SemanticOrDynamicColorType),
=======
  onTintColor?: ?string,
  thumbTintColor?: ?string,
  tintColor?: ?string,
>>>>>>> v0.58.6
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
