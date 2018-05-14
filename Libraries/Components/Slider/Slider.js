/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Image = require('Image');
const ColorPropType = require('ColorPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const ReactNative = require('ReactNative');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

import type {ImageSource} from 'ImageSource';
import type {ViewStyleProp} from 'StyleSheet';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

type Event = Object;

type IOSProps = $ReadOnly<{|
  trackImage?: ?ImageSource,
  minimumTrackImage?: ?ImageSource,
  maximumTrackImage?: ?ImageSource,
  thumbImage?: ?ImageSource,
|}>;

type AndroidProps = $ReadOnly<{|
  thumbTintColor?: ?ColorValue,
|}>;

type Props = $ReadOnly<{|
  ...ViewProps,
  ...IOSProps,
  ...AndroidProps,
  style?: ?ViewStyleProp,
  value?: ?number,
  step?: ?number,
  minimumValue?: ?number,
  maximumValue?: ?number,
  minimumTrackTintColor?: ?ColorValue,
  maximumTrackTintColor?: ?ColorValue,
  disabled?: ?boolean,
  onValueChange?: ?Function,
  onSlidingComplete?: ?Function,
  testID?: ?string,
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
const Slider = createReactClass({
  displayName: 'Slider',
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,

    /**
     * Used to style and layout the `Slider`.  See `StyleSheet.js` and
     * `ViewStylePropTypes.js` for more info.
     */
    style: ViewPropTypes.style,

    /**
     * Initial value of the slider. The value should be between minimumValue
     * and maximumValue, which default to 0 and 1 respectively.
     * Default value is 0.
     *
     * *This is not a controlled component*, you don't need to update the
     * value during dragging.
     */
    value: PropTypes.number,

    /**
     * Step value of the slider. The value should be
     * between 0 and (maximumValue - minimumValue).
     * Default value is 0.
     */
    step: PropTypes.number,

    /**
     * Initial minimum value of the slider. Default value is 0.
     */
    minimumValue: PropTypes.number,

    /**
     * Initial maximum value of the slider. Default value is 1.
     */
    maximumValue: PropTypes.number,

    /**
     * The color used for the track to the left of the button.
     * Overrides the default blue gradient image on iOS.
     */
    minimumTrackTintColor: ColorPropType,

    /**
     * The color used for the track to the right of the button.
     * Overrides the default blue gradient image on iOS.
     */
    maximumTrackTintColor: ColorPropType,

    /**
     * If true the user won't be able to move the slider.
     * Default value is false.
     */
    disabled: PropTypes.bool,

    /**
     * Assigns a single image for the track. Only static images are supported.
     * The center pixel of the image will be stretched to fill the track.
     * @platform ios
     */
    trackImage: Image.propTypes.source,

    /**
     * Assigns a minimum track image. Only static images are supported. The
     * rightmost pixel of the image will be stretched to fill the track.
     * @platform ios
     */
    minimumTrackImage: Image.propTypes.source,

    /**
     * Assigns a maximum track image. Only static images are supported. The
     * leftmost pixel of the image will be stretched to fill the track.
     * @platform ios
     */
    maximumTrackImage: Image.propTypes.source,

    /**
     * Sets an image for the thumb. Only static images are supported.
     * @platform ios
     */
    thumbImage: Image.propTypes.source,

    /**
     * Color of the foreground switch grip.
     * @platform android
     */
    thumbTintColor: ColorPropType,

    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange: PropTypes.func,

    /**
     * Callback that is called when the user releases the slider,
     * regardless if the value has changed. The current value is passed
     * as an argument to the callback handler.
     */
    onSlidingComplete: PropTypes.func,

    /**
     * Used to locate this view in UI automation tests.
     */
    testID: PropTypes.string,
  },

  getDefaultProps: function(): any {
    return {
      disabled: false,
      value: 0,
      minimumValue: 0,
      maximumValue: 1,
      step: 0,
    };
  },

  viewConfig: {
    uiViewClassName: 'RCTSlider',
    validAttributes: {
      ...ReactNativeViewAttributes.RCTView,
      value: true,
    },
  },

  render: function() {
    const {style, onValueChange, onSlidingComplete, ...props} = this.props;
    /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
    props.style = [styles.slider, style];

    /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
    props.onValueChange =
      onValueChange &&
      ((event: Event) => {
        let userEvent = true;
        if (Platform.OS === 'android') {
          // On Android there's a special flag telling us the user is
          // dragging the slider.
          userEvent = event.nativeEvent.fromUser;
        }
        onValueChange && userEvent && onValueChange(event.nativeEvent.value);
      });

    /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
    props.onChange = props.onValueChange;

    /* $FlowFixMe(>=0.54.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error found when Flow v0.54 was deployed. To see the error
     * delete this comment and run Flow. */
    props.onSlidingComplete =
      onSlidingComplete &&
      ((event: Event) => {
        onSlidingComplete && onSlidingComplete(event.nativeEvent.value);
      });

    return (
      <RCTSlider
        {...props}
        enabled={!this.props.disabled}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      />
    );
  },
});

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

let options = {};
if (Platform.OS === 'android') {
  options = {
    nativeOnly: {
      enabled: true,
    },
  };
}
const RCTSlider = requireNativeComponent('RCTSlider', Slider, options);

module.exports = ((Slider: any): Class<ReactNative.NativeComponent<Props>>);
