/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CheckBox
 * @flow
 * @format
 */
'use strict';

const NativeMethodsMixin = require('NativeMethodsMixin');
const PropTypes = require('prop-types');
const React = require('React');
const StyleSheet = require('StyleSheet');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const requireNativeComponent = require('requireNativeComponent');

type DefaultProps = {
  value: boolean,
  disabled: boolean,
};

/**
 * Renders a boolean input (Android only).
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render
 * the supplied `value` prop instead of the expected result of any user actions.
 *
 * @keyword checkbox
 * @keyword toggle
 */
let CheckBox = createReactClass({
  displayName: 'CheckBox',
  propTypes: {
    ...ViewPropTypes,
    /**
     * The value of the checkbox.  If true the checkbox will be turned on.
     * Default value is false.
     */
    value: PropTypes.bool,
    /**
     * If true the user won't be able to toggle the checkbox.
     * Default value is false.
     */
    disabled: PropTypes.bool,
    /**
     * Used in case the props change removes the component.
     */
    onChange: PropTypes.func,
    /**
     * Invoked with the new value when the value changes.
     */
    onValueChange: PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  getDefaultProps: function(): DefaultProps {
    return {
      value: false,
      disabled: false,
    };
  },

  mixins: [NativeMethodsMixin],

  _rctCheckBox: {},
  _onChange: function(event: Object) {
    this._rctCheckBox.setNativeProps({value: this.props.value});
    // Change the props after the native props are set in case the props
    // change removes the component
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange &&
      this.props.onValueChange(event.nativeEvent.value);
  },

  render: function() {
    let props = {...this.props};
    props.onStartShouldSetResponder = () => true;
    props.onResponderTerminationRequest = () => false;
    props.enabled = !this.props.disabled;
    props.on = this.props.value;
    props.style = [styles.rctCheckBox, this.props.style];

    return (
      <RCTCheckBox
        {...props}
        ref={ref => {
          /* $FlowFixMe(>=0.53.0 site=react_native_fb,react_native_oss) This
           * comment suppresses an error when upgrading Flow's support for
           * React. To see the error delete this comment and run Flow. */
          this._rctCheckBox = ref;
        }}
        onChange={this._onChange}
      />
    );
  },
});

let styles = StyleSheet.create({
  rctCheckBox: {
    height: 32,
    width: 32,
  },
});

let RCTCheckBox = requireNativeComponent('AndroidCheckBox', CheckBox, {
  nativeOnly: {
    onChange: true,
    on: true,
    enabled: true,
  },
});

module.exports = CheckBox;
