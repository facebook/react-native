/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * @providesModule SwitchIOS
 *
 * This is a controlled component version of RKSwitch.
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

var RKSwitch = createReactIOSNativeComponentClass({
  validAttributes: rkSwitchAttributes,
  uiViewClassName: 'RCTSwitch',
});

module.exports = SwitchIOS;
