/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

'use strict';

const SwitchNativeComponent = require('SwitchNativeComponent');
const Platform = require('Platform');
const React = require('React');
const StyleSheet = require('StyleSheet');

import type {SwitchChangeEvent} from 'CoreEventTypes';
import type {ColorValue} from 'StyleSheetTypes';
import type {ViewProps} from 'ViewPropTypes';
import type {NativeAndroidProps, NativeIOSProps} from 'SwitchNativeComponent';

export type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * Whether the switch is disabled. Defaults to false.
   */
  disabled?: ?boolean,

  /**
   * Boolean value of the switch. Defaults to false.
   */
  value?: ?boolean,

  /**
   * Custom color for the switch thumb.
   */
  thumbColor?: ?ColorValue,

  /**
   * Custom colors for the switch track.
   *
   * NOTE: On iOS when the switch value is false, the track shrinks into the
   * border. If you want to change the color of the background exposed by the
   * shrunken track, use `ios_backgroundColor`.
   */
  trackColor?: ?$ReadOnly<{|
    false?: ?ColorValue,
    true?: ?ColorValue,
  |}>,

  /**
   * On iOS, custom color for the background. This background color can be seen
   * either when the switch value is false or when the switch is disabled (and
   * the switch is translucent).
   */
  ios_backgroundColor?: ?ColorValue,

  /**
   * Called when the user tries to change the value of the switch.
   *
   * Receives the change event as an argument. If you want to only receive the
   * new value, use `onValueChange` instead.
   */
  onChange?: ?(event: SwitchChangeEvent) => Promise<void> | void,

  /**
   * Called when the user tries to change the value of the switch.
   *
   * Receives the new value as an argument. If you want to instead receive an
   * event, use `onChange`.
   */
  onValueChange?: ?(value: boolean) => Promise<void> | void,
|}>;

/**
 * A visual toggle between two mutually exclusive states.
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render the
 * supplied `value` prop instead of the expected result of any user actions.
 */
class Switch extends React.Component<Props> {
  _nativeSwitchRef: ?React.ElementRef<typeof SwitchNativeComponent>;

  render() {
    const {
      disabled,
      ios_backgroundColor,
      onChange,
      onValueChange,
      style,
      thumbColor,
      trackColor,
      value,
      ...props
    } = this.props;

    // Support deprecated color props.
    let _thumbColor = thumbColor;
    let _trackColorForFalse = trackColor?.false;
    let _trackColorForTrue = trackColor?.true;

    // TODO: Remove support for these props after a couple releases.
    const {thumbTintColor, tintColor, onTintColor} = (props: $FlowFixMe);
    if (thumbTintColor != null) {
      _thumbColor = thumbTintColor;
      if (__DEV__) {
        console.warn(
          'Switch: `thumbTintColor` is deprecated, use `thumbColor` instead.',
        );
      }
    }
    if (tintColor != null) {
      _trackColorForFalse = tintColor;
      if (__DEV__) {
        console.warn(
          'Switch: `tintColor` is deprecated, use `trackColor` instead.',
        );
      }
    }
    if (onTintColor != null) {
      _trackColorForTrue = onTintColor;
      if (__DEV__) {
        console.warn(
          'Switch: `onTintColor` is deprecated, use `trackColor` instead.',
        );
      }
    }

    const platformProps =
      Platform.OS === 'android'
        ? ({
            enabled: disabled !== true,
            on: value === true,
            style,
            thumbTintColor: _thumbColor,
            trackTintColor:
              value === true ? _trackColorForTrue : _trackColorForFalse,
          }: NativeAndroidProps)
        : ({
            disabled,
            onTintColor: _trackColorForTrue,
            style: StyleSheet.compose(
              {height: 31, width: 51},
              StyleSheet.compose(
                style,
                ios_backgroundColor == null
                  ? null
                  : {
                      backgroundColor: ios_backgroundColor,
                      borderRadius: 16,
                    },
              ),
            ),
            thumbTintColor: _thumbColor,
            tintColor: _trackColorForFalse,
            value: value === true,
          }: NativeIOSProps);

    return (
      <SwitchNativeComponent
        {...props}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'button'}
        onChange={this._handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={this._handleSwitchNativeComponentRef}
      />
    );
  }

  _handleChange = (event: SwitchChangeEvent) => {
    if (this._nativeSwitchRef == null) {
      return;
    }

    // Force value of native switch in order to control it.
    const value = this.props.value === true;
    if (Platform.OS === 'android') {
      this._nativeSwitchRef.setNativeProps({on: value});
    } else {
      this._nativeSwitchRef.setNativeProps({value});
    }

    if (this.props.onChange != null) {
      this.props.onChange(event);
    }

    if (this.props.onValueChange != null) {
      this.props.onValueChange(event.nativeEvent.value);
    }
  };

  _handleSwitchNativeComponentRef = (
    ref: ?React.ElementRef<typeof SwitchNativeComponent>,
  ) => {
    this._nativeSwitchRef = ref;
  };
}

const returnsFalse = () => false;
const returnsTrue = () => true;

module.exports = Switch;
