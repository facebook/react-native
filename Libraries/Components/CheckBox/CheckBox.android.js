/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const React = require('React');
const ReactNative = require('ReactNative');
const StyleSheet = require('StyleSheet');

const requireNativeComponent = require('requireNativeComponent');
const nullthrows = require('nullthrows');

const RCTCheckBox = requireNativeComponent('AndroidCheckBox');

import type {ViewProps} from 'ViewPropTypes';
import type {SyntheticEvent} from 'CoreEventTypes';

type CheckBoxEvent = SyntheticEvent<
  $ReadOnly<{|
    target: number,
    value: boolean,
  |}>,
>;

type Props = $ReadOnly<{|
  ...ViewProps,

  /**
   * The value of the checkbox.  If true the checkbox will be turned on.
   * Default value is false.
   */
  value?: ?boolean,

  /**
   * If true the user won't be able to toggle the checkbox.
   * Default value is false.
   */
  disabled?: ?boolean,

  /**
   * Used in case the props change removes the component.
   */
  onChange?: ?(event: CheckBoxEvent) => mixed,

  /**
   * Invoked with the new value when the value changes.
   */
  onValueChange?: ?(value: boolean) => mixed,

  /**
   * Used to locate this view in end-to-end tests.
   */
  testID?: ?string,

  /**
   * Used to get the ref for the native checkbox
   */
  ref?: ?Object,
|}>;

/**
 * Renders a boolean input (Android only).
 *
 * This is a controlled component that requires an `onValueChange` callback that
 * updates the `value` prop in order for the component to reflect user actions.
 * If the `value` prop is not updated, the component will continue to render
 * the supplied `value` prop instead of the expected result of any user actions.
 *
 * ```
 * import React from 'react';
 * import { AppRegistry, StyleSheet, Text, View, CheckBox } from 'react-native';
 *
 * export default class App extends React.Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {
 *       checked: false
 *     }
 *   }
 *
 *   toggle() {
 *     this.setState(({checked}) => {
 *       return {
 *         checked: !checked
 *       };
 *     });
 *   }
 *
 *   render() {
 *     const {checked} = this.state;
 *     return (
 *       <View style={styles.container}>
 *         <Text>Checked</Text>
 *         <CheckBox value={checked} onChange={this.toggle.bind(this)} />
 *       </View>
 *     );
 *   }
 * }
 *
 * const styles = StyleSheet.create({
 *   container: {
 *     flex: 1,
 *     flexDirection: 'row',
 *     alignItems: 'center',
 *     justifyContent: 'center',
 *   },
 * });
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('App', () => App);
 * ```
 *
 * @keyword checkbox
 * @keyword toggle
 */
class CheckBox extends React.Component<Props> {
  // $FlowFixMe How to type a native component to be able to call setNativeProps
  _nativeRef: ?React.ElementRef<typeof RCTCheckBox> = null;

  static defaultProps = {
    value: false,
    disabled: false,
  };

  _setAndForwardRef = nativeRef => {
    const {ref} = this.props;

    this._nativeRef = nativeRef;

    // Forward to user ref prop (if one has been specified)
    // String-based refs cannot be shared.
    if (typeof ref === 'function') {
      ref(nativeRef);
    } else if (typeof ref === 'object' && ref != null) {
      ref.current = nativeRef;
    }
  };

  _onChange = (event: CheckBoxEvent) => {
    nullthrows(this._nativeRef).setNativeProps({value: this.props.value});
    // Change the props after the native props are set in case the props
    // change removes the component
    this.props.onChange && this.props.onChange(event);
    this.props.onValueChange &&
      this.props.onValueChange(event.nativeEvent.value);
  };

  render() {
    const props = {
      ...this.props,
      onStartShouldSetResponder: () => true,
      onResponderTerminationRequest: () => false,
      enabled: !this.props.disabled,
      on: this.props.value,
      style: [styles.rctCheckBox, this.props.style],
    };

    return (
      <RCTCheckBox
        {...props}
        ref={this._setAndForwardRef}
        onChange={this._onChange}
      />
    );
  }
}

const styles = StyleSheet.create({
  rctCheckBox: {
    height: 32,
    width: 32,
  },
});

module.exports = CheckBox;
