/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 */

import type * as React from 'react';
import {Constructor} from 'Utilities';
import {ImageURISource} from '../../Image/ImageSource';
import {NativeMethods} from '../../Renderer/shims/ReactNativeTypes';
import {ColorValue, StyleProp} from '../../StyleSheet/StyleSheet';
import {ViewStyle} from '../../StyleSheet/StyleSheetTypes';
import {ViewProps} from '../View/ViewPropTypes';

export interface SliderPropsAndroid extends ViewProps {
  /**
   * Color of the foreground switch grip.
   */
  thumbTintColor?: ColorValue | undefined;
}

export interface SliderPropsIOS extends ViewProps {
  /**
   * Assigns a maximum track image. Only static images are supported.
   * The leftmost pixel of the image will be stretched to fill the track.
   */
  maximumTrackImage?: ImageURISource | undefined;

  /**
   * Assigns a minimum track image. Only static images are supported.
   * The rightmost pixel of the image will be stretched to fill the track.
   */
  minimumTrackImage?: ImageURISource | undefined;

  /**
   * Sets an image for the thumb. Only static images are supported.
   */
  thumbImage?: ImageURISource | undefined;

  /**
   * Assigns a single image for the track. Only static images
   * are supported. The center pixel of the image will be stretched
   * to fill the track.
   */
  trackImage?: ImageURISource | undefined;
}

export interface SliderProps extends SliderPropsIOS, SliderPropsAndroid {
  /**
   * If true the user won't be able to move the slider.
   * Default value is false.
   */
  disabled?: boolean | undefined;

  /**
   * The color used for the track to the right of the button.
   * Overrides the default blue gradient image.
   */
  maximumTrackTintColor?: ColorValue | undefined;

  /**
   * Initial maximum value of the slider. Default value is 1.
   */
  maximumValue?: number | undefined;

  /**
   * The color used for the track to the left of the button.
   * Overrides the default blue gradient image.
   */
  minimumTrackTintColor?: ColorValue | undefined;

  /**
   * Initial minimum value of the slider. Default value is 0.
   */
  minimumValue?: number | undefined;

  /**
   * Callback called when the user finishes changing the value (e.g. when the slider is released).
   */
  onSlidingComplete?: ((value: number) => void) | undefined;

  /**
   * Callback continuously called while the user is dragging the slider.
   */
  onValueChange?: ((value: number) => void) | undefined;

  /**
   * Step value of the slider. The value should be between 0 and (maximumValue - minimumValue). Default value is 0.
   */
  step?: number | undefined;

  /**
   * Used to style and layout the Slider. See StyleSheet.js for more info.
   */
  style?: StyleProp<ViewStyle> | undefined;

  /**
   * Used to locate this view in UI automation tests.
   */
  testID?: string | undefined;

  /**
   * Initial value of the slider. The value should be between minimumValue
   * and maximumValue, which default to 0 and 1 respectively.
   * Default value is 0.
   * This is not a controlled component, you don't need to update
   * the value during dragging.
   */
  value?: number | undefined;
}

/**
 * A component used to select a single value from a range of values.
 */
declare class SliderComponent extends React.Component<SliderProps> {}
declare const SliderBase: Constructor<NativeMethods> & typeof SliderComponent;
/**
 * Slider has been extracted from react-native core and will be removed in a future release.
 * It can now be installed and imported from `@react-native-community/slider` instead of 'react-native'.
 * @see https://github.com/callstack/react-native-slider
 * @deprecated
 */
export class Slider extends SliderBase {}
/**  SliderIOS has been removed from react-native.
 * It can now be installed and imported from `@react-native-community/slider` instead of 'react-native'.
 * @see https://github.com/callstack/react-native-slider
 * @deprecated
 */
export type SliderIOS = Slider;
