/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CheckBoxAndroid
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

var CHECKBOX = 'checkbox';

/**
 * Standard Android checkbox component.
 * iOS does not have a checkbox component. You may want to use `<Switch />` instead.
 */
var CheckBoxAndroid = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    ...View.propTypes,
    /**
     * Boolean value of the switch.
     */
    value: PropTypes.bool,
    /**
     * If `false`, this component can't be interacted with.
     */
    enabled: PropTypes.bool,
    /**
     * Invoked with the new value when the value changes.
     */
    onValueChange: PropTypes.func,

    /**
     * The label to be showed with the checkbox.
     */
    text: PropTypes.string,

    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  getDefaultProps: function() {
    return {
      value: false,
      enabled: true,
    };
  },

  _onChange: function(event) {
    // The underlying checkbox might have changed, but we're controlled,
    // and so want to ensure it represents our value.
    this.refs[CHECKBOX].setNativeProps({on: this.props.value});

    if (this.props.value === event.nativeEvent.value || !this.props.enabled) {
      return;
    }

    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    return (
      <RCheckbox
        ref={CHECKBOX}
        style={this.props.style}
        enabled={this.props.enabled}
        on={this.props.value}
        onChange={this._onChange}
        text={this.props.text}
        testID={this.props.testID}
        onStartShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
      />
    );
  }
});

var RCheckbox = requireNativeComponent('AndroidCheckBox', CheckBoxAndroid, {
  nativeOnly: {
    on: true,
    enabled: true,
    text: ''
  }
});

module.exports = CheckBoxAndroid;
