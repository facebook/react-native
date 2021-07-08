/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');

import RCTSoftInputViewNativeComponent from './RCTSoftInputViewNativeComponent';

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';

/**
 * Note: iOS only
 *
 * A component which enables customization of the soft input view.
 * This component can be used to display e.g. date pickers, pickers or other custom way of inputting data.
 *
 * To use this component wrap your custom input component with the
 * SoftInputView component, and set a nativeID. Then, pass that nativeID
 * as the softInputViewID of whatever TextInput you desire. A simple
 * example:
 *
 * ```ReactNativeWebPlayer
 * import React, { Component } from 'react';
 * import { AppRegistry, TextInput, SoftInputView, Button } from 'react-native';
 *
 * export default class UselessTextInput extends Component {
 *   constructor(props) {
 *     super(props);
 *     this.state = {platform: 'Android'};
 *   }
 *
 *   render() {
 *     const softInputViewID = "uniqueID";
 *     return (
 *       <View>
 *         <ScrollView keyboardDismissMode="interactive">
 *           <TextInput
 *             style={{
 *               padding: 10,
 *               paddingTop: 50,
 *             }}
 *             softInputViewID={softInputViewID}
 *             value={this.state.platform}
 *           />
 *         </ScrollView>
 *         <SoftInputView nativeID={softInputViewID}>
 *           <Button
 *             onPress={() => this.setState({platform: 'Android'})}
 *             title="Android"
 *           />
 *           <Button
 *             onPress={() => this.setState({platform: 'iOS'})}
 *             title="iOS"
 *           />
 *         </SoftInputView>
 *       </View>
 *     );
 *   }
 * }
 *
 * // skip this line if using Create React Native App
 * AppRegistry.registerComponent('AwesomeProject', () => UselessTextInput);
 * ```
 */

type Props = $ReadOnly<{|
  +children: React.Node,
  /**
   * An ID which is used to associate this `SoftInputView` to
   * specified TextInput(s).
   */
  nativeID?: ?string,
  style?: ?ViewStyleProp,
|}>;

class SoftInputView extends React.Component<Props> {
  render(): React.Node {
    if (Platform.OS !== 'ios') {
      console.warn('<SoftInputView> is only supported on iOS.');
    }

    if (
      React.Children.count(this.props.children) === 0 ||
      !this.props.nativeID
    ) {
      return null;
    }

    return (
      <RCTSoftInputViewNativeComponent
        style={[this.props.style, styles.container]}
        nativeID={this.props.nativeID}>
        {this.props.children}
      </RCTSoftInputViewNativeComponent>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
  },
});

module.exports = SoftInputView;
