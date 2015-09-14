/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SwitchAndroid
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');

var requireNativeComponent = require('requireNativeComponent');

var SWITCH = 'switch';

/**
 * Standard Android two-state toggle component
 */
var SwitchAndroid = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * Boolean value of the switch.
     */
    value: PropTypes.bool,
    /**
     * If `true`, this component can't be interacted with.
     */
    disabled: PropTypes.bool,
    /**
     * Invoked with the new value when the value chages.
     */
    onValueChange: PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  getDefaultProps: function() {
    return {
      value: false,
      disabled: false,
    };
  },

  _onChange: function(event) {
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);

    // The underlying switch might have changed, but we're controlled,
    // and so want to ensure it represents our value.
    this.refs[SWITCH].setNativeProps({on: this.props.value});
  },

  render: function() {
    return (
      <RKSwitch
        ref={SWITCH}
        style={this.props.style}
        enabled={!this.props.disabled}
        on={this.props.value}
        onChange={this._onChange}
        testID={this.props.testID}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      />
    );
  }
});

var RKSwitch = requireNativeComponent('AndroidSwitch', null);

module.exports = SwitchAndroid;
