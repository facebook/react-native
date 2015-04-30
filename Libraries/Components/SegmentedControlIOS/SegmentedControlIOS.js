/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SegmentedControlIOS
 * @flow
 *
 * This is a controlled component version of RCTSegmentedControl.
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var merge = require('merge');

var SEGMENTED_CONTROL_REFERENCE = 'segmentedcontrol';

type DefaultProps = {
  values: Array<string>;
  disabled: boolean;
};


type Event = Object;

/**
 * Use `SegmentedControlIOS` to render a UISegmentedControl iOS.
 */
var SegmentedControlIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * The labels for the control's segment buttons, in order.
     */
    values: PropTypes.arrayOf(PropTypes.string),

    /**
     * The index in `props.values` of the segment to be pre-selected
     */
    selectedSegmentIndex: PropTypes.number,

    /**
     * Used to style and layout the `SegmentedControl`.  See `StyleSheet.js` and
     * `ViewStylePropTypes.js` for more info.
     */
    style: View.propTypes.style,

    /**
     * Callback that is called when the user taps a segment;
     * passes the segment's value as an argument
     */
    onValueChange: PropTypes.func,

    /**
     * Callback that is called when the user taps a segment;
     * passes the event as an argument
     */
    onChange: PropTypes.func,

    /**
     * If true the user won't be able to interact with the control.
     * Default value is false.
     */
    disabled: PropTypes.bool,

    /**
     * Accent color of the control.
     */
    tintColor: PropTypes.string,

    /**
     * If true, then selecting a segment won't persist visually.
     * The `onValueChange` callback will still work as expected.
     */
    momentary: PropTypes.bool
  },

  getDefaultProps: function(): DefaultProps {
    return {
      values: [],
      disabled: false
    };
  },

  _onChange: function(event: Event) {
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    var valuesAndSelectedSegmentIndex = {
      selectedSegmentIndex: this.props.selectedSegmentIndex,
      values: this.props.values
    };
    return (
      <RCTSegmentedControl
        ref={SEGMENTED_CONTROL_REFERENCE}
        style={[styles.segmentedControl, this.props.style]}
        enabled={!this.props.disabled}
        valuesAndSelectedSegmentIndex={valuesAndSelectedSegmentIndex}
        tintColor={this.props.tintColor}
        onChange={this._onChange}
        momentary={this.props.momentary}
      />
    );
  }
});


var styles = StyleSheet.create({
  segmentedControl: {
    // Hard-coded to match UISegmentedControl#intrinsicContentSize.height
    height: 28
  },
});

var rkSegmentedControlAttributes = merge(ReactIOSViewAttributes.UIView, {
  tintColor: true,
  momentary: true,
  enabled: true,
  // Send both values simultaneously, to avoid race condition where
  // `selectedSegmentIndex` is set before `values`
  valuesAndSelectedSegmentIndex: true
});


var RCTSegmentedControl = createReactIOSNativeComponentClass({
  validAttributes: rkSegmentedControlAttributes,
  uiViewClassName: 'RCTSegmentedControl',
});

module.exports = SegmentedControlIOS;
