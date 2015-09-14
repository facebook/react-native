/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SliderIOS
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

type Event = Object;

var SliderIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * Used to style and layout the `Slider`.  See `StyleSheet.js` and
     * `ViewStylePropTypes.js` for more info.
     */
    style: View.propTypes.style,

    /**
     * Initial value of the slider. The value should be between minimumValue
     * and maximumValue, which default to 0 and 1 respectively.
     * Default value is 0.
     *
     * *This is not a controlled component*, e.g. if you don't update
     * the value, the component won't be reset to its inital value.
     */
    value: PropTypes.number,

    /**
     * Initial minimum value of the slider. Default value is 0.
     */
    minimumValue: PropTypes.number,

    /**
     * Initial maximum value of the slider. Default value is 1.
     */
    maximumValue: PropTypes.number,

    /**
     * The color used for the track to the left of the button. Overrides the
     * default blue gradient image.
     */
    minimumTrackTintColor: PropTypes.string,

    /**
     * The color used for the track to the right of the button. Overrides the
     * default blue gradient image.
     */
    maximumTrackTintColor: PropTypes.string,

    /**
     * Callback continuously called while the user is dragging the slider.
     */
    onValueChange: PropTypes.func,

    /**
     * Callback called when the user finishes changing the value (e.g. when
     * the slider is released).
     */
    onSlidingComplete: PropTypes.func,
  },

  _onValueChange: function(event: Event) {
    this.props.onChange && this.props.onChange(event);
    if (event.nativeEvent.continuous) {
      this.props.onValueChange &&
        this.props.onValueChange(event.nativeEvent.value);
    } else {
      this.props.onSlidingComplete && event.nativeEvent.value !== undefined &&
        this.props.onSlidingComplete(event.nativeEvent.value);
    }
  },

  render: function() {
    return (
      <RCTSlider
        style={[styles.slider, this.props.style]}
        value={this.props.value}
        maximumValue={this.props.maximumValue}
        minimumValue={this.props.minimumValue}
        minimumTrackTintColor={this.props.minimumTrackTintColor}
        maximumTrackTintColor={this.props.maximumTrackTintColor}
        onChange={this._onValueChange}
      />
    );
  }
});

var styles = StyleSheet.create({
  slider: {
    height: 40,
  },
});

var RCTSlider = requireNativeComponent('RCTSlider', SliderIOS, {
  nativeOnly: { onChange: true },
});

module.exports = SliderIOS;
