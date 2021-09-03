/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

import * as React from 'react';
import Platform from '../../Utilities/Platform';
import SliderNativeComponent from './SliderNativeComponent';
import StyleSheet, {
  type ViewStyleProp,
  type ColorValue,
} from '../../StyleSheet/StyleSheet';

import type {ImageSource} from '../../Image/ImageSource';
import type {ViewProps} from '../View/ViewPropTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {AccessibilityState} from '../View/ViewAccessibility';

type Event = SyntheticEvent<
  $ReadOnly<{|
    value: number,
    /**
     * Android Only.
     */
    fromUser?: boolean,
  |}>,
>;

type IOSProps = $ReadOnly<{|
  /**
   * Assigns a single image for the track. Only static images are supported.
   * The center pixel of the image will be stretched to fill the track.
   */
  trackImage?: ?ImageSource,

  /**
   * Assigns a minimum track image. Only static images are supported. The
   * rightmost pixel of the image will be stretched to fill the track.
   */
  minimumTrackImage?: ?ImageSource,

  /**
   * Assigns a maximum track image. Only static images are supported. The
   * leftmost pixel of the image will be stretched to fill the track.
   */
  maximumTrackImage?: ?ImageSource,

  /**
   * Sets an image for the thumb. Only static images are supported.
   */
  thumbImage?: ?ImageSource,
|}>;

type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,

  /**
   * Used to style and layout the `Slider`.  See `StyleSheet.js` and
   * `DeprecatedViewStylePropTypes.js` for more info.
   */
  style?: ?ViewStyleProp,

  /**
   * Initial value of the slider. The value should be between minimumValue
   * and maximumValue, which default to 0 and 1 respectively.
   * Default value is 0.
   *
   * *This is not a controlled component*, you don't need to update the
   * value during dragging.
   */
  value?: ?number,

  /**
   * Step value of the slider. The value should be
   * between 0 and (maximumValue - minimumValue).
   * Default value is 0.
   */
  step?: ?number,

  /**
   * Initial minimum value of the slider. Default value is 0.
   */
  minimumValue?: ?number,

  /**
   * Initial maximum value of the slider. Default value is 1.
   */
  maximumValue?: ?number,

  /**
   * The color used for the track to the left of the button.
   * Overrides the default blue gradient image on iOS.
   */
  minimumTrackTintColor?: ?ColorValue,

  /**
   * The color used for the track to the right of the button.
   * Overrides the default blue gradient image on iOS.
   */
  maximumTrackTintColor?: ?ColorValue,
  /**
   * The color used to tint the default thumb images on iOS, or the
   * color of the foreground switch grip on Android.
   */
  thumbTintColor?: ?ColorValue,

  /**
   * If true the user won't be able to move the slider.
   * Default value is false.
   */
  disabled?: ?boolean,

  /**
   * Callback continuously called while the user is dragging the slider.
   */
  onValueChange?: ?(value: number) => void,

  /**
   * Callback that is called when the user releases the slider,
   * regardless if the value has changed. The current value is passed
   * as an argument to the callback handler.
   */
  onSlidingComplete?: ?(value: number) => void,

  /**
   * Used to locate this view in UI automation tests.
   */
  testID?: ?string,

  /**
    Indicates to accessibility services that UI Component is in a specific State.
   */
  accessibilityState?: ?AccessibilityState,
|}>;

/**
 * A component used to select a single value from a range of values.
 *
 * ### Usage
 *
 * The example below shows how to use `Slider` to change
 * a value used by `Text`. The value is stored using
 * the state of the root component (`App`). The same component
 * subscribes to the `onValueChange`  of `Slider` and changes
 * the value using `setState`.
 *
 *```
 * import React from 'react';
 * import { StyleSheet, Text, View, Slider } from 'react-native';
 *
 * export default class App extends React.Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       value: 50
 *     }
 *   }
 *
 *   change(value) {
 *     this.setState(() => {
 *       return {
 *         value: parseFloat(value)
 *       };
 *     });
 *   }
 *
 *   render() {
 *     const {value} = this.state;
 *     return (
 *       <View style={styles.container}>
 *         <Text style={styles.text}>{String(value)}</Text>
 *         <Slider
 *           step={1}
 *           maximumValue={100}
 *           onValueChange={this.change.bind(this)}
 *           value={value} />
 *       </View>
 *     );
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     flexDirection: 'column',
 *     justifyContent: 'center'
 *   },
 *   text: {
 *     fontSize: 50,
 *     textAlign: 'center'
 *   }
 * });
 *```
 *
 */
const Slider = (
  props: Props,
  forwardedRef?: ?React.Ref<typeof SliderNativeComponent>,
) => {
  const style = StyleSheet.compose(styles.slider, props.style);

  const {
    value = 0.5,
    minimumValue = 0,
    maximumValue = 1,
    step = 0,
    onValueChange,
    onSlidingComplete,
    ...localProps
  } = props;

  const onValueChangeEvent = onValueChange
    ? (event: Event) => {
        let userEvent = true;
        if (Platform.OS === 'android') {
          // On Android there's a special flag telling us the user is
          // dragging the slider.
          userEvent =
            event.nativeEvent.fromUser != null && event.nativeEvent.fromUser;
        }
        userEvent && onValueChange(event.nativeEvent.value);
      }
    : null;

  const onChangeEvent = onValueChangeEvent;
  const onSlidingCompleteEvent = onSlidingComplete
    ? (event: Event) => {
        onSlidingComplete(event.nativeEvent.value);
      }
    : null;

  const disabled =
    props.disabled === true || props.accessibilityState?.disabled === true;
  const accessibilityState = disabled
    ? {...props.accessibilityState, disabled: true}
    : props.accessibilityState;

  return (
    <SliderNativeComponent
      {...localProps}
      accessibilityState={accessibilityState}
      // TODO: Reconcile these across the two platforms.
      enabled={!disabled}
      disabled={disabled}
      maximumValue={maximumValue}
      minimumValue={minimumValue}
      onChange={onChangeEvent}
      onResponderTerminationRequest={() => false}
      onSlidingComplete={onSlidingCompleteEvent}
      onStartShouldSetResponder={() => true}
      onValueChange={onValueChangeEvent}
      ref={forwardedRef}
      step={step}
      style={style}
      value={value}
    />
  );
};

const SliderWithRef: React.AbstractComponent<
  Props,
  React.ElementRef<typeof SliderNativeComponent>,
> = React.forwardRef(Slider);

let styles;
if (Platform.OS === 'ios') {
  styles = StyleSheet.create({
    slider: {
      height: 40,
    },
  });
} else {
  styles = StyleSheet.create({
    slider: {},
  });
}

module.exports = SliderWithRef;
