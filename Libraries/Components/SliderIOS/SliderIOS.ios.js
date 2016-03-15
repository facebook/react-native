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

var Image = require('Image');
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
    ...View.propTypes,
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
     * the value, the component won't be reset to its initial value.
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
     * If true the user won't be able to move the slider.
     * Default value is false.
     */
    disabled: PropTypes.bool,

    /**
     * Assigns a single image for the track. Only static images are supported.
     * The center pixel of the image will be stretched to fill the track.
     */
    trackImage: Image.propTypes.source,

    /**
     * Assigns a minimum track image. Only static images are supported. The
     * rightmost pixel of the image will be stretched to fill the track.
     */
    minimumTrackImage: Image.propTypes.source,

    /**
     * Assigns a maximum track image. Only static images are supported. The
     * leftmost pixel of the image will be stretched to fill the track.
     */
    maximumTrackImage: Image.propTypes.source,

    /**
     * Sets an image for the thumb. It only supports static images.
     */
    thumbImage: Image.propTypes.source,

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

  getDefaultProps: function() : any {
    return {
      disabled: false,
    };
  },

  render: function() {
    let {style, onValueChange, onSlidingComplete, ...props} = this.props;
    props.style = [styles.slider, style];

    props.onValueChange = onValueChange && ((event: Event) => {
      onValueChange && onValueChange(event.nativeEvent.value);
    });

    props.onSlidingComplete = onSlidingComplete && ((event: Event) => {
      onSlidingComplete && onSlidingComplete(event.nativeEvent.value);
    });

    return <RCTSlider {...props}/>;
  }
});

var styles = StyleSheet.create({
  slider: {
    height: 40,
  },
});

var RCTSlider = requireNativeComponent('RCTSlider', SliderIOS);

module.exports = SliderIOS;
