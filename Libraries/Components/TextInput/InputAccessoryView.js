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

const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');

import RCTInputAccessoryViewNativeComponent from './RCTInputAccessoryViewNativeComponent';

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';

/**
 * Note: iOS only
 *
 * A component which enables customization of the keyboard input accessory view.
 * The input accessory view is displayed above the keyboard whenever a TextInput
 * has focus. This component can be used to create custom toolbars.
 *
 * To use this component wrap your custom toolbar with the
 * InputAccessoryView component, and set a nativeID. Then, pass that nativeID
 * as the inputAccessoryViewID of whatever TextInput you desire. A simple
 * example:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, TextInput, InputAccessoryView, Button } from 'react-native';
 *
 * export default class UselessTextInput extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {text: 'Placeholder Text'};
 *   }
 *
 *   render() {
 *     const inputAccessoryViewID = "uniqueID";
 *     return (
 *       <View>
 *         <ScrollView keyboardDismissMode="interactive">
 *           <TextInput
 *             style={{
 *               padding: 10,
 *               paddingTop: 50,
 *             }}
 *             inputAccessoryViewID=inputAccessoryViewID
 *             onChangeText={text => this.setState({text})}
 *             value={this.state.text}
 *           />
 *         </ScrollView>
 *         <InputAccessoryView nativeID=inputAccessoryViewID>
 *           <Button
 *             onPress={() => this.setState({text: 'Placeholder Text'})}
 *             title="Reset Text"
 *           />
 *         </InputAccessoryView>
 *       </View>
 *     );
 *   }
 * }
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
 *
 * This component can also be used to create sticky text inputs (text inputs
 * which are anchored to the top of the keyboard). To do this, wrap a
 * TextInput with the InputAccessoryView component, and don't set a nativeID.
 * For an example, look at InputAccessoryViewExample.js in RNTester.
 */

type Props = $ReadOnly<{|
  +children: React.Node,
  /**
   * An ID which is used to associate this `InputAccessoryView` to
   * specified TextInput(s).
   */
  nativeID?: ?string,
  style?: ?ViewStyleProp,
  backgroundColor?: ?ColorValue,
|}>;

class InputAccessoryView extends React.Component<Props> {
  render(): React.Node {
    if (Platform.OS !== 'ios') {
      console.warn('<InputAccessoryView> is only supported on iOS.');
    }

    if (React.Children.count(this.props.children) === 0) {
      return null;
    }

    return (
      <RCTInputAccessoryViewNativeComponent
        style={[this.props.style, styles.container]}
        nativeID={this.props.nativeID}
        backgroundColor={this.props.backgroundColor}>
        {this.props.children}
      </RCTInputAccessoryViewNativeComponent>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

module.exports = InputAccessoryView;
