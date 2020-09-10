/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @generate-docs
 */

'use strict';

import Platform from '../../Utilities/Platform';
import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';

import AndroidSwitchNativeComponent, {
  Commands as AndroidSwitchCommands,
} from './AndroidSwitchNativeComponent';
import SwitchNativeComponent, {
  Commands as SwitchCommands,
} from './SwitchNativeComponent';

import type {ColorValue} from '../../StyleSheet/StyleSheetTypes';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

type SwitchChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    value: boolean,
  |}>,
>;

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
  _nativeSwitchRef: ?React.ElementRef<
    typeof SwitchNativeComponent | typeof AndroidSwitchNativeComponent,
  >;
  _lastNativeValue: ?boolean;

  render(): React.Node {
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

    const trackColorForFalse = trackColor?.false;
    const trackColorForTrue = trackColor?.true;

    if (Platform.OS === 'android') {
      const platformProps = {
        enabled: disabled !== true,
        on: value === true,
        style,
        thumbTintColor: thumbColor,
        trackColorForFalse: trackColorForFalse,
        trackColorForTrue: trackColorForTrue,
        trackTintColor: value === true ? trackColorForTrue : trackColorForFalse,
      };

      return (
        <AndroidSwitchNativeComponent
          {...props}
          {...platformProps}
          accessibilityRole={props.accessibilityRole ?? 'switch'}
          onChange={this._handleChange}
          onResponderTerminationRequest={returnsFalse}
          onStartShouldSetResponder={returnsTrue}
          ref={this._handleSwitchNativeComponentRef}
        />
      );
    }

    const platformProps = {
      disabled,
      onTintColor: trackColorForTrue,
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
      thumbTintColor: thumbColor,
      tintColor: trackColorForFalse,
      value: value === true,
    };

    return (
      <SwitchNativeComponent
        {...props}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'switch'}
        onChange={this._handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={this._handleSwitchNativeComponentRef}
      />
    );
  }

  componentDidUpdate() {
    // This is necessary in case native updates the switch and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const nativeProps = {};
    const value = this.props.value === true;

    if (this._lastNativeValue !== value) {
      nativeProps.value = value;
    }

    if (
      Object.keys(nativeProps).length > 0 &&
      this._nativeSwitchRef &&
      this._nativeSwitchRef.setNativeProps
    ) {
      if (Platform.OS === 'android') {
        AndroidSwitchCommands.setNativeValue(
          this._nativeSwitchRef,
          nativeProps.value,
        );
      } else {
        SwitchCommands.setValue(this._nativeSwitchRef, nativeProps.value);
      }
    }
  }

  _handleChange = (event: SwitchChangeEvent) => {
    if (this.props.onChange != null) {
      this.props.onChange(event);
    }

    if (this.props.onValueChange != null) {
      this.props.onValueChange(event.nativeEvent.value);
    }

    this._lastNativeValue = event.nativeEvent.value;
    this.forceUpdate();
  };

  _handleSwitchNativeComponentRef = (
    ref: ?React.ElementRef<
      typeof SwitchNativeComponent | typeof AndroidSwitchNativeComponent,
    >,
  ) => {
    this._nativeSwitchRef = ref;
  };
}

const returnsFalse = () => false;
const returnsTrue = () => true;

module.exports = Switch;
