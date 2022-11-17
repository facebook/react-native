/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @generate-docs
 */

import type {ColorValue} from '../../StyleSheet/StyleSheet';
import type {SyntheticEvent} from '../../Types/CoreEventTypes';
import type {ViewProps} from '../View/ViewPropTypes';

import StyleSheet from '../../StyleSheet/StyleSheet';
import Platform from '../../Utilities/Platform';
import useMergeRefs from '../../Utilities/useMergeRefs';
import AndroidSwitchNativeComponent, {
  Commands as AndroidSwitchCommands,
} from './AndroidSwitchNativeComponent';
import SwitchNativeComponent, {
  Commands as SwitchCommands,
} from './SwitchNativeComponent';
import * as React from 'react';

type SwitchChangeEvent = SyntheticEvent<
  $ReadOnly<{|
    value: boolean,
    target: number,
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
const returnsFalse = () => false;
const returnsTrue = () => true;

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

const SwitchWithForwardedRef: React.AbstractComponent<
  Props,
  React.ElementRef<
    typeof SwitchNativeComponent | typeof AndroidSwitchNativeComponent,
  >,
> = React.forwardRef(function Switch(props, forwardedRef): React.Node {
  const {
    disabled,
    ios_backgroundColor,
    onChange,
    onValueChange,
    style,
    thumbColor,
    trackColor,
    value,
    ...restProps
  } = props;
  const trackColorForFalse = trackColor?.false;
  const trackColorForTrue = trackColor?.true;

  const nativeSwitchRef = React.useRef<React.ElementRef<
    typeof SwitchNativeComponent | typeof AndroidSwitchNativeComponent,
  > | null>(null);

  const ref = useMergeRefs(nativeSwitchRef, forwardedRef);

  const [native, setNative] = React.useState({value: null});

  const handleChange = (event: SwitchChangeEvent) => {
    onChange?.(event);
    onValueChange?.(event.nativeEvent.value);
    setNative({value: event.nativeEvent.value});
  };

  React.useLayoutEffect(() => {
    // This is necessary in case native updates the switch and JS decides
    // that the update should be ignored and we should stick with the value
    // that we have in JS.
    const jsValue = value === true;
    const shouldUpdateNativeSwitch =
      native.value != null && native.value !== jsValue;
    if (
      shouldUpdateNativeSwitch &&
      nativeSwitchRef.current?.setNativeProps != null
    ) {
      if (Platform.OS === 'android') {
        AndroidSwitchCommands.setNativeValue(nativeSwitchRef.current, jsValue);
      } else {
        SwitchCommands.setValue(nativeSwitchRef.current, jsValue);
      }
    }
  }, [value, native]);

  if (Platform.OS === 'android') {
    const {accessibilityState} = restProps;
    const _disabled =
      disabled != null ? disabled : accessibilityState?.disabled;

    const _accessibilityState =
      _disabled !== accessibilityState?.disabled
        ? {...accessibilityState, disabled: _disabled}
        : accessibilityState;

    const platformProps = {
      accessibilityState: _accessibilityState,
      enabled: _disabled !== true,
      on: value === true,
      style,
      thumbTintColor: thumbColor,
      trackColorForFalse: trackColorForFalse,
      trackColorForTrue: trackColorForTrue,
      trackTintColor: value === true ? trackColorForTrue : trackColorForFalse,
    };

    return (
      <AndroidSwitchNativeComponent
        {...restProps}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'switch'}
        onChange={handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={ref}
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
        {...restProps}
        {...platformProps}
        accessibilityRole={props.accessibilityRole ?? 'switch'}
        onChange={handleChange}
        onResponderTerminationRequest={returnsFalse}
        onStartShouldSetResponder={returnsTrue}
        ref={ref}
      />
    );
  }
});

export default SwitchWithForwardedRef;
