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

var ColorPropType = require('ColorPropType');
var NativeMethodsMixin = require('NativeMethodsMixin');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var StyleSheet = require('StyleSheet');
var View = require('View');

var requireNativeComponent = require('requireNativeComponent');

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
    ...View.propTypes,
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
    onTintColor: ColorPropType,

    /**
     * Background color for the switch round button.
     */
    thumbTintColor: ColorPropType,

    /**
     * Background color when the switch is turned off.
     */
    tintColor: ColorPropType,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      value: false,
      disabled: false,
    };
  },

  _onChange: function(event: Event) {
    // The underlying switch might have changed, but we're controlled,
    // and so want to ensure it represents our value.
    this.refs[SWITCH].setNativeProps({value: this.props.value});

    if (this.props.value === event.nativeEvent.value || this.props.disabled) {
      return;
    }

    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    return (
      <RCTSwitch
        {...this.props}
        ref={SWITCH}
        onChange={this._onChange}
        style={[styles.rkSwitch, this.props.style]}
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

var RCTSwitch = requireNativeComponent('RCTSwitch', SwitchIOS, {
  nativeOnly: { onChange: true }
});

module.exports = SwitchIOS;
