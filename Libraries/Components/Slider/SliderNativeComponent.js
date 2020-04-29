/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
<<<<<<< HEAD
 * @flow
=======
 * @flow strict-local
>>>>>>> fb/0.62-stable
 */

'use strict';

import type {
<<<<<<< HEAD
  Float,
  BubblingEventHandler,
  DirectEventHandler,
=======
  BubblingEventHandler,
  DirectEventHandler,
  Double,
>>>>>>> fb/0.62-stable
  WithDefault,
} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
<<<<<<< HEAD
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';
=======
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';
>>>>>>> fb/0.62-stable

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ImageSource} from '../../Image/ImageSource';
import type {ViewProps} from '../View/ViewPropTypes';

type Event = $ReadOnly<{|
<<<<<<< HEAD
  value: Float,
=======
  value: Double,
>>>>>>> fb/0.62-stable
  fromUser?: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
<<<<<<< HEAD
  enabled?: WithDefault<boolean, false>,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: WithDefault<Float, 1>,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: WithDefault<Float, 0>,
  step?: WithDefault<Float, 0>,
=======
  enabled?: WithDefault<boolean, true>,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: WithDefault<Double, 1>,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: WithDefault<Double, 0>,
  step?: WithDefault<Double, 0>,
>>>>>>> fb/0.62-stable
  testID?: WithDefault<string, ''>,
  thumbImage?: ?ImageSource,
  thumbTintColor?: ?ColorValue,
  trackImage?: ?ImageSource,
<<<<<<< HEAD
  value?: WithDefault<Float, 0>,
=======
  value?: WithDefault<Double, 0>,
>>>>>>> fb/0.62-stable

  // Events
  onChange?: ?BubblingEventHandler<Event>,
  onValueChange?: ?BubblingEventHandler<Event, 'paperValueChange'>,
  onSlidingComplete?: ?DirectEventHandler<Event, 'paperSlidingComplete'>,
|}>;

export default (codegenNativeComponent<NativeProps>('Slider', {
  interfaceOnly: true,
  paperComponentName: 'RCTSlider',
<<<<<<< HEAD
}): NativeComponentType<NativeProps>);
=======
}): HostComponent<NativeProps>);
>>>>>>> fb/0.62-stable
