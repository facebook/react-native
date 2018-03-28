/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @providesModule Switch
 * @flow
 */
'use strict';

const ColorPropType = require('ColorPropType');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const React = require('React');
const PropTypes = require('prop-types');
const StyleSheet = require('StyleSheet');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  value: boolean,
  disabled: boolean,
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
const Switch = createReactClass({
  displayName: 'Switch',
  propTypes: {
    ...ViewPropTypes,
    /**
     * The value of the switch.  If true the switch will be turned on.
     * Default value is false.
     */
    value: PropTypes.bool,
    /**
     * If true the user won't be able to toggle the switch.
     * Default value is false.
     */
    disabled: PropTypes.bool,
    /**
     * Invoked with the new value when the value changes.
     */
    onValueChange: PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,

    /**
     * Border color on iOS and background color on Android when the switch is turned off.
     */
    tintColor: ColorPropType,
    /**
     * Background color when the switch is turned on.
     */
    onTintColor: ColorPropType,
    /**
     * Color of the foreground switch grip.
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
    /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This comment
     * suppresses an error when upgrading Flow's support for React. To see the
     * error delete this comment and run Flow. */
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange && this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    const props = {...this.props};
    props.onStartShouldSetResponder = () => true;
    props.onResponderTerminationRequest = () => false;
    if (Platform.OS === 'android') {
      props.enabled = !this.props.disabled;
      props.on = this.props.value;
      props.style = this.props.style;
      props.trackTintColor = this.props.value ? this.props.onTintColor : this.props.tintColor;
    } else if (Platform.OS === 'ios') {
      props.style = [styles.rctSwitchIOS, this.props.style];
    }
    return (
      <RCTSwitch
        {...props}
        /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
         * comment suppresses an error when upgrading Flow's support for React.
         * To see the error delete this comment and run Flow. */
        ref={(ref) => { this._rctSwitch = ref; }}
        onChange={this._onChange}
      />
    );
  },
});

const styles = StyleSheet.create({
  rctSwitchIOS: {
    height: 31,
    width: 51,
  }
});

if (Platform.OS === 'android') {
  var RCTSwitch = requireNativeComponent('AndroidSwitch', Switch, {
    nativeOnly: {
      onChange: true,
      on: true,
      enabled: true,
      trackTintColor: true,
    }
  });
} else {
  var RCTSwitch = requireNativeComponent('RCTSwitch', Switch, {
    nativeOnly: {
      onChange: true
    }
  });
}

module.exports = Switch;
