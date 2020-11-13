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

import type {ColorValue} from '../../StyleSheet/StyleSheet';
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
    If true the user won't be able to toggle the switch.

    @default false
   */
  disabled?: ?boolean,

  /**
    The value of the switch. If true the switch will be turned on.

    @default false
   */
  value?: ?boolean,

  /**
    Color of the foreground switch grip. If this is set on iOS, the switch grip will lose its drop shadow.
   */
  thumbColor?: ?ColorValue,

  /**
    Custom colors for the switch track.

    _iOS_: When the switch value is false, the track shrinks into the border. If you want to change the
    color of the background exposed by the shrunken track, use
     [`ios_backgroundColor`](https://reactnative.dev/docs/switch#ios_backgroundColor).
   */
  trackColor?: ?$ReadOnly<{|
    false?: ?ColorValue,
    true?: ?ColorValue,
  |}>,

  /**
    On iOS, custom color for the background. This background color can be
    seen either when the switch value is false or when the switch is
    disabled (and the switch is translucent).
   */
  ios_backgroundColor?: ?ColorValue,

  /**
    Invoked when the user tries to change the value of the switch. Receives
    the change event as an argument. If you want to only receive the new
    value, use `onValueChange` instead.
   */
  onChange?: ?(event: SwitchChangeEvent) => Promise<void> | void,

  /**
    Invoked when the user tries to change the value of the switch. Receives
    the new value as an argument. If you want to instead receive an event,
    use `onChange`.
   */
  onValueChange?: ?(value: boolean) => Promise<void> | void,
|}>;

/**
  Renders a boolean input.

  This is a controlled component that requires an `onValueChange`
  callback that updates the `value` prop in order for the component to
  reflect user actions. If the `value` prop is not updated, the
  component will continue to render the supplied `value` prop instead of
  the expected result of any user actions.

  ```SnackPlayer name=Switch
  import React, { useState } from "react";
  import { View, Switch, StyleSheet } from "react-native";

  const App = () => {
    const [isEnabled, setIsEnabled] = useState(false);
    const toggleSwitch = () => setIsEnabled(previousState => !previousState);

    return (
      <View style={styles.container}>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isEnabled ? "#f5dd4b" : "#f4f3f4"}
          ios_backgroundColor="#3e3e3e"
          onValueChange={toggleSwitch}
          value={isEnabled}
        />
      </View>
    );
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center"
    }
  });

  export default App;
  ```
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
    } else {
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
