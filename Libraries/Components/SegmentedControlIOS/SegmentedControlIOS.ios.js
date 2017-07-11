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
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var React = require('React');
var PropTypes = require('prop-types');
var StyleSheet = require('StyleSheet');
var ViewPropTypes = require('ViewPropTypes');

var createReactClass = require('create-react-class');
var requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  values: Array<string>,
  enabled: boolean,
};

var SEGMENTED_CONTROL_REFERENCE = 'segmentedcontrol';

type Event = Object;

/**
 * Use `SegmentedControlIOS` to render a UISegmentedControl iOS.
 *
 * #### Programmatically changing selected index
 *
 * The selected index can be changed on the fly by assigning the
 * selectIndex prop to a state variable, then changing that variable.
 * Note that the state variable would need to be updated as the user
 * selects a value and changes the index, as shown in the example below.
 *
 * ````
 * <SegmentedControlIOS
 *   values={['One', 'Two']}
 *   selectedIndex={this.state.selectedIndex}
 *   onChange={(event) => {
 *     this.setState({selectedIndex: event.nativeEvent.selectedSegmentIndex});
 *   }}
 * />
 * ````
 */
// $FlowFixMe(>=0.41.0)
var SegmentedControlIOS = createReactClass({
  displayName: 'SegmentedControlIOS',
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...ViewPropTypes,
    /**
     * The labels for the control's segment buttons, in order.
     */
    values: PropTypes.arrayOf(PropTypes.string),

    /**
     * The index in `props.values` of the segment to be (pre)selected.
     */
    selectedIndex: PropTypes.number,

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
     * If false the user won't be able to interact with the control.
     * Default value is true.
     */
    enabled: PropTypes.bool,

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
      enabled: true
    };
  },

  _onChange: function(event: Event) {
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    return (
      <RCTSegmentedControl
        {...this.props}
        ref={SEGMENTED_CONTROL_REFERENCE}
        style={[styles.segmentedControl, this.props.style]}
        onChange={this._onChange}
      />
    );
  }
});

var styles = StyleSheet.create({
  segmentedControl: {
    height: 28,
  },
});

var RCTSegmentedControl = requireNativeComponent(
  'RCTSegmentedControl',
  SegmentedControlIOS
);

module.exports = SegmentedControlIOS;
