/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  BubblingEventHandler,
  DirectEventHandler,
  Double,
  WithDefault,
} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import type {HostComponent} from '../../Renderer/shims/ReactNativeTypes';

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {ImageSource} from '../../Image/ImageSource';
import type {ViewProps} from '../View/ViewPropTypes';

type Event = $ReadOnly<{|
  value: Double,
  fromUser?: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  enabled?: WithDefault<boolean, true>,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: WithDefault<Double, 1>,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: WithDefault<Double, 0>,
  step?: WithDefault<Double, 0>,
  testID?: WithDefault<string, ''>,
  thumbImage?: ?ImageSource,
  thumbTintColor?: ?ColorValue,
  trackImage?: ?ImageSource,
  value?: WithDefault<Double, 0>,

  // Events
  onChange?: ?BubblingEventHandler<Event>,
  onValueChange?: ?BubblingEventHandler<Event, 'paperValueChange'>,
  onSlidingComplete?: ?DirectEventHandler<Event, 'paperSlidingComplete'>,
|}>;

export default (codegenNativeComponent<NativeProps>('Slider', {
  interfaceOnly: true,
  paperComponentName: 'RCTSlider',
}): HostComponent<NativeProps>);
