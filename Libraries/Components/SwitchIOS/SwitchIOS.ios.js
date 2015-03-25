/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule SwitchIOS
 * @flow
 *
 * This is a controlled component version of RCTSwitch.
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var merge = require('merge');

var SWITCH = 'switch';

type DefaultProps = {
  value: boolean;
  disabled: boolean;
};

type Event = Object;

/**
 * Use `SwitchIOS` to render a boolean input on iOS.  This is
 * a controlled component, so you must hook in to the `onValueChange` callback
 * and update the `value` prop in order for the component to update, otherwise
 * the user's change will be reverted immediately to reflect `props.value` as the
 * source of truth.
 */
var SwitchIOS = React.createClass({
  mixins: [NativeMethodsMixin],

  propTypes: {
    /**
     * The value of the switch, if true the switch will be turned on.
     * Default value is false.
     */
    value: PropTypes.bool,

    /**
     * If true the user won't be able to toggle the switch.
     * Default value is false.
     */
    disabled: PropTypes.bool,

    /**
     * Callback that is called when the user toggles the switch.
     */
    onValueChange: PropTypes.func,

    /**
     * Background color when the switch is turned on.
     */
    onTintColor: PropTypes.string,

    /**
     * Background color for the switch round button.
     */
    thumbTintColor: PropTypes.string,

    /**
     * Background color when the switch is turned off.
     */
    tintColor: PropTypes.string,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      value: false,
      disabled: false,
    };
  },

  _onChange: function(event: Event) {
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);

    // The underlying switch might have changed, but we're controlled,
    // and so want to ensure it represents our value.
    this.refs[SWITCH].setNativeProps({on: this.props.value});
  },

  render: function() {
    return (
      <RCTSwitch
        ref={SWITCH}
        style={[styles.rkSwitch, this.props.style]}
        enabled={!this.props.disabled}
        on={this.props.value}
        onChange={this._onChange}
        onTintColor={this.props.onTintColor}
        thumbTintColor={this.props.thumbTintColor}
        tintColor={this.props.tintColor}
      />
    );
  }
});

var styles = StyleSheet.create({
  rkSwitch: {
    height: 31,
    width: 51,
  },
});

var rkSwitchAttributes = merge(ReactIOSViewAttributes.UIView, {
  onTintColor: true,
  tintColor: true,
  thumbTintColor: true,
  on: true,
  enabled: true,
});

var RCTSwitch = createReactIOSNativeComponentClass({
  validAttributes: rkSwitchAttributes,
  uiViewClassName: 'RCTSwitch',
});

module.exports = SwitchIOS;
