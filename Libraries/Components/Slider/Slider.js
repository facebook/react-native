/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Slider
 * @flow
 */
'use strict';

var Image = require('Image');
var ColorPropType = require('ColorPropType');
var NativeMethodsMixin = require('NativeMethodsMixin');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var Platform = require('Platform');
var React = require('React');
var PropTypes = require('prop-types');
var StyleSheet = require('StyleSheet');
var ViewPropTypes = require('ViewPropTypes');

var createReactClass = require('create-react-class');
var requireNativeComponent = require('requireNativeComponent');

type Event = Object;

/**
 * A component used to select a single value from a range of values.
 */
// $FlowFixMe(>=0.41.0)
var Slider = createReactClass({
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

  getDefaultProps: function() : any {
    return {
      disabled: false,
      value: 0,
      minimumValue: 0,
      maximumValue: 1,
      step: 0
    };
  },

  viewConfig: {
    uiViewClassName: 'RCTSlider',
    validAttributes: {
      ...ReactNativeViewAttributes.RCTView,
      value: true
    }
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
    props.onValueChange = onValueChange && ((event: Event) => {
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
    props.onSlidingComplete = onSlidingComplete && ((event: Event) => {
      onSlidingComplete && onSlidingComplete(event.nativeEvent.value);
    });

    return <RCTSlider
      {...props}
      enabled={!this.props.disabled}
      onStartShouldSetResponder={() => true}
      onResponderTerminationRequest={() => false}
    />;
  }
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
    }
  };
}
const RCTSlider = requireNativeComponent('RCTSlider', Slider, options);

module.exports = Slider;
