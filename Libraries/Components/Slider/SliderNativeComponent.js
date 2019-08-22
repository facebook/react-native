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

import type {
  Float,
  BubblingEventHandler,
  DirectEventHandler,
  WithDefault,
} from '../../Types/CodegenTypes';

import codegenNativeComponent from '../../Utilities/codegenNativeComponent';
import {type NativeComponentType} from '../../Utilities/codegenNativeComponent';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {ImageSource} from '../../Image/ImageSource';
import type {ViewProps} from '../View/ViewPropTypes';

type Event = $ReadOnly<{|
  value: Float,
  fromUser?: boolean,
|}>;

type NativeProps = $ReadOnly<{|
  ...ViewProps,

  // Props
  disabled?: WithDefault<boolean, false>,
  enabled?: WithDefault<boolean, false>,
  maximumTrackImage?: ?ImageSource,
  maximumTrackTintColor?: ?ColorValue,
  maximumValue?: WithDefault<Float, 1>,
  minimumTrackImage?: ?ImageSource,
  minimumTrackTintColor?: ?ColorValue,
  minimumValue?: WithDefault<Float, 0>,
  step?: WithDefault<Float, 0>,
  testID?: WithDefault<string, ''>,
  thumbImage?: ?ImageSource,
  thumbTintColor?: ?ColorValue,
  trackImage?: ?ImageSource,
  value?: WithDefault<Float, 0>,

  // Events
  onChange?: ?BubblingEventHandler<Event>,
  onValueChange?: ?BubblingEventHandler<Event, 'paperValueChange'>,
  onSlidingComplete?: ?DirectEventHandler<Event, 'paperSlidingComplete'>,
|}>;

export default (codegenNativeComponent<NativeProps>('Slider', {
  interfaceOnly: true,
  paperComponentName: 'RCTSlider',
}): NativeComponentType<NativeProps>);
