/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @generate-docs
 */

'use strict';

const Platform = require('../../Utilities/Platform');
const React = require('react');
const StyleSheet = require('../../StyleSheet/StyleSheet');

import RCTInputAccessoryViewNativeComponent from './RCTInputAccessoryViewNativeComponent';

import type {ViewStyleProp} from '../../StyleSheet/StyleSheet';
import type {ColorValue} from '../../StyleSheet/StyleSheet';

type Props = $ReadOnly<{|
  +children: React.Node,
  /**
    An ID which is used to associate this `InputAccessoryView` to specified
    TextInput(s).
   */
  nativeID?: ?string,
  /**
    @type ViewStyleProps
   */
  style?: ?ViewStyleProp,
  backgroundColor?: ?ColorValue,
|}>;

/**
  A component which enables customization of the keyboard input accessory view
  on iOS. The input accessory view is displayed above the keyboard whenever a
  `TextInput` has focus. This component can be used to create custom toolbars.

  To use this component wrap your custom toolbar with the InputAccessoryView
  component, and set a `nativeID`. Then, pass that `nativeID` as the
  `inputAccessoryViewID` of whatever `TextInput` you desire. A basic example:

  ```SnackPlayer name=InputAccessoryView&supportedPlatforms=ios
  import React, { useState } from 'react';
  import { Button, InputAccessoryView, ScrollView, TextInput } from 'react-native';

  export default App = () => {
    const inputAccessoryViewID = 'uniqueID';
    const initialText = 'Placeholder Text';
    const [text, setText] = useState(initialText);

    return (
      <>
        <ScrollView keyboardDismissMode="interactive">
          <TextInput
            style={{
              padding: 16,
              marginTop: 50
            }}
            inputAccessoryViewID={inputAccessoryViewID}
            onChangeText={text => setText(text)}
            value={text}
          />
        </ScrollView>
        <InputAccessoryView nativeID={inputAccessoryViewID}>
          <Button
            onPress={() => setText(initialText)}
            title="Reset Text"
          />
        </InputAccessoryView>
      </>
    );
  }
  ```

  This component can also be used to create sticky text inputs (text inputs
  which are anchored to the top of the keyboard). To do this, wrap a `TextInput`
  with the `InputAccessoryView` component, and don't set a `nativeID`. For an
  example, look at
  [InputAccessoryViewExample.js](react-native:InputAccessoryView).

  [react-native:InputAccessoryView]:
  https://github.com/facebook/react-native/blob/master/RNTester/js/examples/InputAccessoryView/InputAccessoryViewExample.js
 */
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
