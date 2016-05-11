/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Switch
 * @flow
 */
'use strict';

var ColorPropType = require('ColorPropType');
var NativeMethodsMixin = require('NativeMethodsMixin');
var Platform = require('Platform');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  value: boolean;
  disabled: boolean;
};

/**
 * Renders a boolean input.
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render
 * the supplied `value` prop instead of the expected result of any user actions.
 *
 * @keyword checkbox
 * @keyword toggle
 */
var Switch = React.createClass({
  propTypes: {
    ...View.propTypes,
    /**
     * The value of the switch.  If true the switch will be turned on.
     * Default value is false.
     */
    value: React.PropTypes.bool,
    /**
     * If true the user won't be able to toggle the switch.
     * Default value is false.
     */
    disabled: React.PropTypes.bool,
    /**
     * Invoked with the new value when the value changes.
     */
    onValueChange: React.PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: React.PropTypes.string,

    /**
     * Background color when the switch is turned off.
     * @platform ios
     */
    tintColor: ColorPropType,
    /**
     * Background color when the switch is turned on.
     * @platform ios
     */
    onTintColor: ColorPropType,
    /**
     * Color of the foreground switch grip.
     * @platform ios
     */
    thumbTintColor: ColorPropType,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      value: false,
      disabled: false,
    };
  },

  mixins: [NativeMethodsMixin],

  _rctSwitch: {},
  _onChange: function(event: Object) {
    if (Platform.OS === 'android') {
      this._rctSwitch.setNativeProps({on: this.props.value});
    } else {
      this._rctSwitch.setNativeProps({value: this.props.value});
    }
    //Change the props after the native props are set in case the props change removes the component
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    var props = {...this.props};
    props.onStartShouldSetResponder = () => true;
    props.onResponderTerminationRequest = () => false;
    if (Platform.OS === 'android') {
      props.enabled = !this.props.disabled;
      props.on = this.props.value;
      props.style = this.props.style;
    } else if (Platform.OS === 'ios') {
      props.style = [styles.rctSwitchIOS, this.props.style];
    }
    return (
      <RCTSwitch
        {...props}
        ref={(ref) => { this._rctSwitch = ref; }}
        onChange={this._onChange}
      />
    );
  },
});

var styles = StyleSheet.create({
  rctSwitchIOS: {
    height: 31,
    width: 51,
  }
});

if (Platform.OS === 'android') {
  var RCTSwitch = requireNativeComponent('AndroidSwitch', Switch, {
    nativeOnly: { onChange: true, on: true, enabled: true }
  });
} else {
  var RCTSwitch = requireNativeComponent('RCTSwitch', Switch, {
    nativeOnly: { onChange: true }
  });
}

module.exports = Switch;
