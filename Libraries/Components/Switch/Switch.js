/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Platform = require('Platform');
const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');

const nullthrows = require('fbjs/lib/nullthrows');
const requireNativeComponent = require('requireNativeComponent');

import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';

type Props = $ReadOnly<{|
  ...ViewProps,
  /**
   * The value of the switch.  If true the switch will be turned on.
   * Default value is false.
   */
  value?: ?boolean,

  /**
   * If true the user won't be able to toggle the switch.
   * Default value is false.
   */
  disabled?: ?boolean,

  /**
   * Switch change handler.
   *
   * Invoked with the event when the value changes. For getting the value
   * the switch was changed to use onValueChange instead.
   */
  onChange?: ?Function,

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ?Function,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  /**
   * Border color on iOS and background color on Android when the switch is turned off.
   */
  tintColor?: ?ColorValue,

  /**
   * Background color when the switch is turned on.
   */
  onTintColor?: ?ColorValue,

  /**
   * Color of the foreground switch grip.
   */
  thumbTintColor?: ?ColorValue,
|}>;

type NativeSwitchType = Class<
  ReactNative.NativeComponent<
    $ReadOnly<{|
      ...Props,
      enabled?: ?boolean,
      on?: ?boolean,
      trackTintColor?: ?ColorValue,
    |}>,
  >,
>;

const RCTSwitch: NativeSwitchType =
  Platform.OS === 'android'
    ? (requireNativeComponent('AndroidSwitch'): any)
    : (requireNativeComponent('RCTSwitch'): any);

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
class Switch extends React.Component<Props> {
  static defaultProps = {
    value: false,
    disabled: false,
  };

  _rctSwitch: ?React.ElementRef<NativeSwitchType> = null;

  _onChange = (event: Object) => {
    if (Platform.OS === 'android') {
      nullthrows(this._rctSwitch).setNativeProps({on: this.props.value});
    } else {
      nullthrows(this._rctSwitch).setNativeProps({value: this.props.value});
    }

    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange &&
      this.props.onValueChange(event.nativeEvent.value);
  };

  render() {
    const props = {
      ...this.props,
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: () => false,
    };

    const platformProps =
      Platform.OS === 'android'
        ? {
            enabled: !this.props.disabled,
            on: this.props.value,
            style: this.props.style,
            trackTintColor: this.props.value
              ? this.props.onTintColor
              : this.props.tintColor,
          }
        : {
            style: StyleSheet.compose(
              styles.rctSwitchIOS,
              this.props.style,
            ),
          };

    return (
      <RCTSwitch
        {...props}
        {...platformProps}
        ref={ref => {
          this._rctSwitch = ref;
        }}
        onChange={this._onChange}
      />
    );
  }
}

const styles = StyleSheet.create({
  rctSwitchIOS: {
    height: 31,
    width: 51,
  },
});

module.exports = Switch;
